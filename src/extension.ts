import * as vscode from 'vscode';
import * as path from 'path';
import { LanguageClient, LanguageClientOptions, ServerOptions } from 'vscode-languageclient/node';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

let client: LanguageClient | undefined;
let diagnosticCollection: vscode.DiagnosticCollection;
let validationTimeout: NodeJS.Timeout | undefined;

/**
 * Validate a LUMOS document and update diagnostics
 */
async function validateDocument(document: vscode.TextDocument): Promise<void> {
    try {
        // Clear existing diagnostics
        diagnosticCollection.delete(document.uri);

        // Skip if document is not saved (for CLI validation)
        if (document.isUntitled) {
            return;
        }

        const filePath = document.fileName;

        // Run lumos validate command
        const { stdout, stderr } = await execAsync(`lumos validate "${filePath}"`, {
            cwd: path.dirname(filePath),
            timeout: 5000
        });

        // If validation passes, no diagnostics needed
        if (!stderr) {
            return;
        }

        // Parse errors from stderr
        const diagnostics = parseValidationErrors(stderr, document);

        if (diagnostics.length > 0) {
            diagnosticCollection.set(document.uri, diagnostics);
        }

    } catch (error: any) {
        // Parse errors from error output
        if (error.stderr) {
            const diagnostics = parseValidationErrors(error.stderr, document);
            if (diagnostics.length > 0) {
                diagnosticCollection.set(document.uri, diagnostics);
            }
        }
    }
}

/**
 * Parse validation errors from lumos CLI output
 */
function parseValidationErrors(errorOutput: string, document: vscode.TextDocument): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];

    // Current LUMOS error format:
    // Error: Failed to parse schema: file.lumos
    // Caused by:
    //     Schema parsing error: expected `:`

    // Try to extract meaningful error message
    let errorMessage = '';

    // Look for "Caused by:" section with actual error details
    const causedByMatch = /Caused by:\s*(?:Schema parsing error:\s*)?(.+?)(?:\n|$)/i.exec(errorOutput);
    if (causedByMatch) {
        errorMessage = causedByMatch[1].trim();
    }

    // Fallback: Look for any "Error:" line
    if (!errorMessage) {
        const errorMatch = /(?:Error|error):\s*(.+?)(?:\n|$)/i.exec(errorOutput);
        if (errorMatch) {
            errorMessage = errorMatch[1].trim();
        }
    }

    if (errorMessage) {
        // Try to find the error location in the document
        const position = findErrorLocation(errorMessage, document);

        const diagnostic = new vscode.Diagnostic(
            position,
            `LUMOS: ${errorMessage}`,
            vscode.DiagnosticSeverity.Error
        );

        diagnostic.source = 'LUMOS';
        diagnostics.push(diagnostic);
    }

    return diagnostics;
}

/**
 * Try to find the location of an error in the document based on error message
 */
function findErrorLocation(errorMessage: string, document: vscode.TextDocument): vscode.Range {
    // Default to first line
    let line = 0;
    let column = 0;

    // Try to find the error based on context clues
    if (errorMessage.includes('expected `:`')) {
        // Look for field without colon
        for (let i = 0; i < document.lineCount; i++) {
            const lineText = document.lineAt(i).text;
            // Match: field_name PublicKey (missing colon)
            if (/^\s+\w+\s+\w+\s*$/.test(lineText) && !lineText.includes(':')) {
                line = i;
                column = lineText.indexOf(lineText.trim());
                break;
            }
        }
    } else if (errorMessage.includes('expected `;`') || errorMessage.includes('semicolon')) {
        // Look for line missing semicolon in struct
        for (let i = 0; i < document.lineCount; i++) {
            const lineText = document.lineAt(i).text;
            if (lineText.includes(':') && !lineText.trim().endsWith(';') && !lineText.trim().endsWith('{')) {
                line = i;
                column = lineText.length - 1;
                break;
            }
        }
    } else if (errorMessage.includes('expected `{`')) {
        // Look for struct without opening brace
        for (let i = 0; i < document.lineCount; i++) {
            const lineText = document.lineAt(i).text;
            if (/struct\s+\w+/.test(lineText) && !lineText.includes('{')) {
                line = i;
                column = lineText.length;
                break;
            }
        }
    }

    return new vscode.Range(
        new vscode.Position(line, column),
        new vscode.Position(line, column + 1)
    );
}

/**
 * Code action provider for LUMOS quick fixes
 */
class LumosCodeActionProvider implements vscode.CodeActionProvider {
    provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range | vscode.Selection,
        context: vscode.CodeActionContext,
        token: vscode.CancellationToken
    ): vscode.CodeAction[] {
        const codeActions: vscode.CodeAction[] = [];

        // Process diagnostics in the current range
        for (const diagnostic of context.diagnostics) {
            if (diagnostic.source !== 'LUMOS') {
                continue;
            }

            const message = diagnostic.message.toLowerCase();

            // Quick fix: Missing colon
            if (message.includes('expected `:`') || message.includes('expected ":"')) {
                const fix = this.createAddColonFix(document, diagnostic);
                if (fix) codeActions.push(fix);
            }

            // Quick fix: Missing semicolon
            if (message.includes('expected `;`') || message.includes('expected ";"') || message.includes('semicolon')) {
                const fix = this.createAddSemicolonFix(document, diagnostic);
                if (fix) codeActions.push(fix);
            }

            // Quick fix: Wrong type casing (pubkey → PublicKey)
            if (message.includes('pubkey') || message.includes('unknown type')) {
                const fix = this.createFixTypeCasingFix(document, diagnostic);
                if (fix) codeActions.push(fix);
            }

            // Quick fix: Missing #[solana] attribute
            if (message.includes('solana') && message.includes('attribute')) {
                const fix = this.createAddSolanaAttributeFix(document, diagnostic);
                if (fix) codeActions.push(fix);
            }
        }

        return codeActions;
    }

    private createAddColonFix(document: vscode.TextDocument, diagnostic: vscode.Diagnostic): vscode.CodeAction | undefined {
        const line = document.lineAt(diagnostic.range.start.line);
        const lineText = line.text;

        // Find field name (word before cursor)
        const match = /(\w+)\s+(\w+)/.exec(lineText);
        if (!match) return undefined;

        const fieldName = match[1];
        const insertPos = new vscode.Position(diagnostic.range.start.line, line.text.indexOf(fieldName) + fieldName.length);

        const fix = new vscode.CodeAction('Add colon after field name', vscode.CodeActionKind.QuickFix);
        fix.edit = new vscode.WorkspaceEdit();
        fix.edit.insert(document.uri, insertPos, ':');
        fix.diagnostics = [diagnostic];
        fix.isPreferred = true;

        return fix;
    }

    private createAddSemicolonFix(document: vscode.TextDocument, diagnostic: vscode.Diagnostic): vscode.CodeAction | undefined {
        const line = document.lineAt(diagnostic.range.start.line);
        const lineText = line.text.trimEnd();

        // Insert semicolon at end of line
        const insertPos = new vscode.Position(diagnostic.range.start.line, lineText.length);

        const fix = new vscode.CodeAction('Add semicolon at end of line', vscode.CodeActionKind.QuickFix);
        fix.edit = new vscode.WorkspaceEdit();
        fix.edit.insert(document.uri, insertPos, ';');
        fix.diagnostics = [diagnostic];
        fix.isPreferred = true;

        return fix;
    }

    private createFixTypeCasingFix(document: vscode.TextDocument, diagnostic: vscode.Diagnostic): vscode.CodeAction | undefined {
        const line = document.lineAt(diagnostic.range.start.line);
        const lineText = line.text;

        // Look for common type casing errors
        const typeMappings: { [key: string]: string } = {
            'pubkey': 'PublicKey',
            'publickey': 'PublicKey',
            'signature': 'Signature',
            'vec': 'Vec',
            'option': 'Option',
            'string': 'String'
        };

        for (const [wrong, correct] of Object.entries(typeMappings)) {
            const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
            if (regex.test(lineText)) {
                const fix = new vscode.CodeAction(`Change '${wrong}' to '${correct}'`, vscode.CodeActionKind.QuickFix);
                fix.edit = new vscode.WorkspaceEdit();

                const newText = lineText.replace(regex, correct);
                const range = new vscode.Range(
                    new vscode.Position(diagnostic.range.start.line, 0),
                    new vscode.Position(diagnostic.range.start.line, lineText.length)
                );

                fix.edit.replace(document.uri, range, newText);
                fix.diagnostics = [diagnostic];
                fix.isPreferred = true;

                return fix;
            }
        }

        return undefined;
    }

    private createAddSolanaAttributeFix(document: vscode.TextDocument, diagnostic: vscode.Diagnostic): vscode.CodeAction | undefined {
        const line = document.lineAt(diagnostic.range.start.line);

        // Find the struct declaration line
        let structLine = diagnostic.range.start.line;
        for (let i = diagnostic.range.start.line; i < Math.min(diagnostic.range.start.line + 5, document.lineCount); i++) {
            const lineText = document.lineAt(i).text;
            if (lineText.includes('struct')) {
                structLine = i;
                break;
            }
        }

        const indentation = document.lineAt(structLine).text.match(/^\s*/)?.[0] || '';
        const insertPos = new vscode.Position(structLine, 0);

        const fix = new vscode.CodeAction('Add #[solana] attribute', vscode.CodeActionKind.QuickFix);
        fix.edit = new vscode.WorkspaceEdit();
        fix.edit.insert(document.uri, insertPos, `${indentation}#[solana]\n`);
        fix.diagnostics = [diagnostic];
        fix.isPreferred = true;

        return fix;
    }
}

/**
 * Document formatting provider for LUMOS language
 */
class LumosFormattingProvider implements vscode.DocumentFormattingEditProvider {
    provideDocumentFormattingEdits(
        document: vscode.TextDocument,
        options: vscode.FormattingOptions,
        token: vscode.CancellationToken
    ): vscode.TextEdit[] {
        const config = vscode.workspace.getConfiguration('lumos');
        const indentSize = config.get<number>('format.indentSize', 4);
        const sortAttributes = config.get<boolean>('format.sortAttributes', true);
        const alignFields = config.get<boolean>('format.alignFields', true);

        const formattedText = this.formatDocument(
            document.getText(),
            indentSize,
            sortAttributes,
            alignFields
        );

        // Return a single edit replacing entire document
        const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(document.getText().length)
        );

        return [vscode.TextEdit.replace(fullRange, formattedText)];
    }

    private formatDocument(
        text: string,
        indentSize: number,
        sortAttributes: boolean,
        alignFields: boolean
    ): string {
        const lines = text.split('\n');
        const formatted: string[] = [];
        let indentLevel = 0;
        let inStruct = false;
        let structFields: string[] = [];
        let attributes: string[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Skip empty lines
            if (line === '') {
                formatted.push('');
                continue;
            }

            // Collect attributes
            if (line.startsWith('#[')) {
                attributes.push(line);
                continue;
            }

            // Flush sorted attributes before struct/enum
            if (attributes.length > 0 && (line.startsWith('struct') || line.startsWith('enum') || line.startsWith('pub'))) {
                if (sortAttributes) {
                    attributes.sort();
                }
                attributes.forEach(attr => {
                    formatted.push(' '.repeat(indentLevel * indentSize) + attr);
                });
                attributes = [];
            }

            // Handle closing braces
            if (line === '}' || line.startsWith('}')) {
                // If we were in a struct, flush fields with alignment
                if (inStruct && structFields.length > 0 && alignFields) {
                    const alignedFields = this.alignStructFields(structFields, indentLevel + 1, indentSize);
                    formatted.push(...alignedFields);
                    structFields = [];
                }
                indentLevel--;
                inStruct = false;
                formatted.push(' '.repeat(indentLevel * indentSize) + line);
                continue;
            }

            // Handle struct/enum declarations
            if (line.startsWith('struct') || line.startsWith('enum') || line.startsWith('pub struct') || line.startsWith('pub enum')) {
                formatted.push(' '.repeat(indentLevel * indentSize) + line);
                if (line.endsWith('{')) {
                    indentLevel++;
                    if (line.includes('struct')) {
                        inStruct = true;
                    }
                }
                continue;
            }

            // Handle opening braces
            if (line === '{') {
                indentLevel++;
                formatted.push(' '.repeat((indentLevel - 1) * indentSize) + line);
                if (formatted[formatted.length - 2] && formatted[formatted.length - 2].includes('struct')) {
                    inStruct = true;
                }
                continue;
            }

            // Collect struct fields for alignment
            if (inStruct && line.includes(':')) {
                structFields.push(line);
                continue;
            }

            // Handle enum variants
            if (!inStruct) {
                formatted.push(' '.repeat(indentLevel * indentSize) + line);
                continue;
            }

            // Default: just indent
            formatted.push(' '.repeat(indentLevel * indentSize) + line);
        }

        // Flush any remaining struct fields
        if (structFields.length > 0 && alignFields) {
            const alignedFields = this.alignStructFields(structFields, indentLevel, indentSize);
            formatted.push(...alignedFields);
        }

        // Flush any remaining attributes
        if (attributes.length > 0) {
            if (sortAttributes) {
                attributes.sort();
            }
            attributes.forEach(attr => {
                formatted.push(' '.repeat(indentLevel * indentSize) + attr);
            });
        }

        return formatted.join('\n');
    }

    private alignStructFields(fields: string[], indentLevel: number, indentSize: number): string[] {
        // Find the longest field name to align colons
        let maxFieldLength = 0;
        const parsedFields = fields.map(field => {
            const colonIndex = field.indexOf(':');
            if (colonIndex > 0) {
                const fieldName = field.substring(0, colonIndex).trim();
                maxFieldLength = Math.max(maxFieldLength, fieldName.length);
                return { fieldName, rest: field.substring(colonIndex).trim() };
            }
            return { fieldName: field, rest: '' };
        });

        // Align fields
        return parsedFields.map(({ fieldName, rest }) => {
            const indent = ' '.repeat(indentLevel * indentSize);
            if (rest) {
                const padding = ' '.repeat(maxFieldLength - fieldName.length);
                return `${indent}${fieldName}${padding}: ${rest.substring(1).trim()}`;
            }
            return `${indent}${fieldName}`;
        });
    }
}

/**
 * Auto-completion provider for LUMOS language
 */
class LumosCompletionProvider implements vscode.CompletionItemProvider {
    provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext
    ): vscode.CompletionItem[] {
        const linePrefix = document.lineAt(position).text.substring(0, position.character);
        const completions: vscode.CompletionItem[] = [];

        // Check context to provide appropriate completions
        if (this.isInAttribute(linePrefix)) {
            completions.push(...this.getAttributeCompletions());
        } else if (this.isAfterColon(linePrefix)) {
            completions.push(...this.getTypeCompletions());
        } else if (this.isAtLineStart(linePrefix)) {
            completions.push(...this.getKeywordCompletions());
            completions.push(...this.getAttributeCompletions());
        } else {
            // Provide all completions
            completions.push(...this.getTypeCompletions());
            completions.push(...this.getKeywordCompletions());
            completions.push(...this.getAttributeCompletions());
        }

        return completions;
    }

    private isInAttribute(linePrefix: string): boolean {
        return linePrefix.includes('#[') && !linePrefix.includes(']');
    }

    private isAfterColon(linePrefix: string): boolean {
        return linePrefix.trim().endsWith(':');
    }

    private isAtLineStart(linePrefix: string): boolean {
        return linePrefix.trim().length === 0;
    }

    private getTypeCompletions(): vscode.CompletionItem[] {
        const types: vscode.CompletionItem[] = [];

        // Primitive unsigned types
        const unsignedTypes = ['u8', 'u16', 'u32', 'u64', 'u128'];
        unsignedTypes.forEach(type => {
            const item = new vscode.CompletionItem(type, vscode.CompletionItemKind.Keyword);
            item.detail = `Unsigned ${type.substring(1)}-bit integer`;
            item.documentation = new vscode.MarkdownString(`Primitive unsigned integer type (${type})`);
            types.push(item);
        });

        // Primitive signed types
        const signedTypes = ['i8', 'i16', 'i32', 'i64', 'i128'];
        signedTypes.forEach(type => {
            const item = new vscode.CompletionItem(type, vscode.CompletionItemKind.Keyword);
            item.detail = `Signed ${type.substring(1)}-bit integer`;
            item.documentation = new vscode.MarkdownString(`Primitive signed integer type (${type})`);
            types.push(item);
        });

        // Boolean
        const boolItem = new vscode.CompletionItem('bool', vscode.CompletionItemKind.Keyword);
        boolItem.detail = 'Boolean type';
        boolItem.documentation = new vscode.MarkdownString('Boolean value (true/false)');
        types.push(boolItem);

        // String
        const stringItem = new vscode.CompletionItem('String', vscode.CompletionItemKind.Class);
        stringItem.detail = 'String type';
        stringItem.documentation = new vscode.MarkdownString('UTF-8 encoded string');
        types.push(stringItem);

        // Solana types
        const pubkeyItem = new vscode.CompletionItem('PublicKey', vscode.CompletionItemKind.Class);
        pubkeyItem.detail = 'Solana public key';
        pubkeyItem.documentation = new vscode.MarkdownString('Solana account public key (32 bytes)');
        types.push(pubkeyItem);

        const signatureItem = new vscode.CompletionItem('Signature', vscode.CompletionItemKind.Class);
        signatureItem.detail = 'Solana signature';
        signatureItem.documentation = new vscode.MarkdownString('Cryptographic signature (64 bytes)');
        types.push(signatureItem);

        // Complex types
        const vecItem = new vscode.CompletionItem('Vec', vscode.CompletionItemKind.Class);
        vecItem.detail = 'Vector type';
        vecItem.documentation = new vscode.MarkdownString('Dynamic array: `Vec<T>`\n\nExample: `Vec<PublicKey>`, `Vec<u64>`');
        vecItem.insertText = new vscode.SnippetString('Vec<$1>$0');
        types.push(vecItem);

        const optionItem = new vscode.CompletionItem('Option', vscode.CompletionItemKind.Class);
        optionItem.detail = 'Optional type';
        optionItem.documentation = new vscode.MarkdownString('Optional value: `Option<T>`\n\nExample: `Option<PublicKey>`, `Option<u64>`');
        optionItem.insertText = new vscode.SnippetString('Option<$1>$0');
        types.push(optionItem);

        return types;
    }

    private getKeywordCompletions(): vscode.CompletionItem[] {
        const keywords: vscode.CompletionItem[] = [];

        // struct keyword
        const structItem = new vscode.CompletionItem('struct', vscode.CompletionItemKind.Keyword);
        structItem.detail = 'Define a struct';
        structItem.documentation = new vscode.MarkdownString('Define a data structure\n\n```lumos\nstruct MyStruct {\n    field: Type,\n}\n```');
        structItem.insertText = new vscode.SnippetString('struct ${1:Name} {\n    ${2:field}: ${3:Type},\n}$0');
        keywords.push(structItem);

        // enum keyword
        const enumItem = new vscode.CompletionItem('enum', vscode.CompletionItemKind.Keyword);
        enumItem.detail = 'Define an enum';
        enumItem.documentation = new vscode.MarkdownString('Define an enumeration\n\n```lumos\nenum MyEnum {\n    Variant1,\n    Variant2,\n}\n```');
        enumItem.insertText = new vscode.SnippetString('enum ${1:Name} {\n    ${2:Variant},\n}$0');
        keywords.push(enumItem);

        // pub keyword
        const pubItem = new vscode.CompletionItem('pub', vscode.CompletionItemKind.Keyword);
        pubItem.detail = 'Public visibility';
        pubItem.documentation = new vscode.MarkdownString('Make item public');
        keywords.push(pubItem);

        return keywords;
    }

    private getAttributeCompletions(): vscode.CompletionItem[] {
        const attributes: vscode.CompletionItem[] = [];

        // #[solana]
        const solanaItem = new vscode.CompletionItem('#[solana]', vscode.CompletionItemKind.Property);
        solanaItem.detail = 'Solana attribute';
        solanaItem.documentation = new vscode.MarkdownString('Mark type for Solana-specific code generation');
        solanaItem.insertText = new vscode.SnippetString('#[solana]');
        attributes.push(solanaItem);

        // #[account]
        const accountItem = new vscode.CompletionItem('#[account]', vscode.CompletionItemKind.Property);
        accountItem.detail = 'Anchor account attribute';
        accountItem.documentation = new vscode.MarkdownString('Mark struct as Anchor account');
        accountItem.insertText = new vscode.SnippetString('#[account]');
        attributes.push(accountItem);

        // #[derive(...)]
        const deriveItem = new vscode.CompletionItem('#[derive]', vscode.CompletionItemKind.Property);
        deriveItem.detail = 'Derive traits';
        deriveItem.documentation = new vscode.MarkdownString('Derive common traits\n\nExample: `#[derive(Debug, Clone)]`');
        deriveItem.insertText = new vscode.SnippetString('#[derive(${1:Debug})]');
        attributes.push(deriveItem);

        return attributes;
    }
}

/**
 * Find lumos-lsp binary in PATH
 */
async function findLSPInPath(): Promise<string | undefined> {
    try {
        const command = process.platform === 'win32' ? 'where lumos-lsp' : 'which lumos-lsp';
        const { stdout } = await execAsync(command);
        const path = stdout.trim();
        return path || undefined;
    } catch {
        return undefined;
    }
}

/**
 * Install lumos-lsp using cargo
 */
async function installLSPServer(): Promise<string | undefined> {
    return await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Installing LUMOS Language Server...',
        cancellable: false
    }, async (progress) => {
        progress.report({ message: 'Running: cargo install lumos-lsp' });

        try {
            await execAsync('cargo install lumos-lsp', { timeout: 300000 }); // 5 minute timeout
            vscode.window.showInformationMessage('LUMOS Language Server installed successfully!');
            return await findLSPInPath();
        } catch (error: any) {
            vscode.window.showErrorMessage(
                `Failed to install LUMOS Language Server: ${error.message}\n\nPlease install manually: cargo install lumos-lsp`
            );
            return undefined;
        }
    });
}

/**
 * Ensure lumos-lsp server is available (find or install)
 */
async function ensureLSPServer(): Promise<string | undefined> {
    const config = vscode.workspace.getConfiguration('lumos');
    const customPath = config.get<string>('lsp.path', 'lumos-lsp');

    // First check if custom path or default path exists
    const lspPath = await findLSPInPath();

    if (lspPath) {
        console.log(`Found LUMOS LSP at: ${lspPath}`);
        return lspPath;
    }

    // Not found, check if auto-install is enabled
    const autoInstall = config.get<boolean>('lsp.autoInstall', true);

    if (!autoInstall) {
        vscode.window.showWarningMessage(
            'LUMOS Language Server not found. Auto-install is disabled.',
            'Install Manually'
        ).then(selection => {
            if (selection === 'Install Manually') {
                vscode.env.openExternal(vscode.Uri.parse('https://crates.io/crates/lumos-lsp'));
            }
        });
        return undefined;
    }

    // Prompt user to install
    const choice = await vscode.window.showInformationMessage(
        'LUMOS Language Server (lumos-lsp) not found. Would you like to install it now?\n\nThis requires Rust and cargo to be installed.',
        'Install Now',
        'Not Now',
        'Learn More'
    );

    if (choice === 'Install Now') {
        return await installLSPServer();
    } else if (choice === 'Learn More') {
        vscode.env.openExternal(vscode.Uri.parse('https://crates.io/crates/lumos-lsp'));
    }

    return undefined;
}

/**
 * Initialize and start the LSP client
 */
async function startLSPClient(context: vscode.ExtensionContext): Promise<void> {
    const config = vscode.workspace.getConfiguration('lumos');
    const lspEnabled = config.get<boolean>('lsp.enable', true);

    if (!lspEnabled) {
        console.log('LUMOS LSP is disabled in settings');
        return;
    }

    // Ensure LSP server binary is available
    const lspPath = await ensureLSPServer();

    if (!lspPath) {
        console.log('LUMOS LSP server not available, skipping LSP activation');
        return;
    }

    // Configure server options
    const serverOptions: ServerOptions = {
        command: lspPath,
        args: []
    };

    // Configure client options
    const traceLevel = config.get<string>('lsp.trace.server', 'off');
    const clientOptions: LanguageClientOptions = {
        documentSelector: [{ scheme: 'file', language: 'lumos' }],
        synchronize: {
            fileEvents: vscode.workspace.createFileSystemWatcher('**/*.lumos')
        },
        outputChannelName: 'LUMOS Language Server',
        traceOutputChannel: vscode.window.createOutputChannel('LUMOS LSP Trace')
    };

    // Create and start the LSP client
    client = new LanguageClient(
        'lumos-lsp',
        'LUMOS Language Server',
        serverOptions,
        clientOptions
    );

    try {
        await client.start();
        console.log('LUMOS Language Server started successfully');
        vscode.window.showInformationMessage('LUMOS Language Server is now active!');
    } catch (error: any) {
        console.error('Failed to start LUMOS Language Server:', error);
        vscode.window.showErrorMessage(
            `Failed to start LUMOS Language Server: ${error.message}`
        );
        client = undefined;
    }
}

export function activate(context: vscode.ExtensionContext) {
    console.log('LUMOS extension activated');

    // Start Language Server Protocol client
    startLSPClient(context).catch(error => {
        console.error('Error starting LUMOS LSP client:', error);
    });

    // Create diagnostic collection (for CLI-based validation fallback)
    diagnosticCollection = vscode.languages.createDiagnosticCollection('lumos');
    context.subscriptions.push(diagnosticCollection);

    // Register auto-completion provider
    const completionProvider = vscode.languages.registerCompletionItemProvider(
        'lumos',
        new LumosCompletionProvider(),
        '.', '<', '#', '[', ':'
    );
    context.subscriptions.push(completionProvider);

    // Register document formatting provider
    const formattingProvider = vscode.languages.registerDocumentFormattingEditProvider(
        'lumos',
        new LumosFormattingProvider()
    );
    context.subscriptions.push(formattingProvider);

    // Register code action provider for quick fixes
    const codeActionProvider = vscode.languages.registerCodeActionsProvider(
        'lumos',
        new LumosCodeActionProvider(),
        { providedCodeActionKinds: [vscode.CodeActionKind.QuickFix] }
    );
    context.subscriptions.push(codeActionProvider);

    // Register commands
    const generateCommand = vscode.commands.registerCommand('lumos.generate', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'lumos') {
            vscode.window.showErrorMessage('Not a LUMOS file');
            return;
        }

        const config = vscode.workspace.getConfiguration('lumos');
        const autoGenerate = config.get<boolean>('codeGeneration.autoGenerate', false);

        if (!autoGenerate) {
            const result = await vscode.window.showInformationMessage(
                'Generate Rust and TypeScript code from this schema?',
                'Yes', 'No'
            );
            if (result !== 'Yes') {
                return;
            }
        }

        // Execute lumos generate command
        const terminal = vscode.window.createTerminal('LUMOS');
        terminal.show();
        terminal.sendText(`lumos generate ${editor.document.fileName}`);
        vscode.window.showInformationMessage('Generating code...');
    });

    const validateCommand = vscode.commands.registerCommand('lumos.validate', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'lumos') {
            vscode.window.showErrorMessage('Not a LUMOS file');
            return;
        }

        // Execute lumos validate command
        const terminal = vscode.window.createTerminal('LUMOS');
        terminal.sendText(`lumos validate ${editor.document.fileName}`);
        vscode.window.showInformationMessage('Validating schema...');
    });

    context.subscriptions.push(generateCommand, validateCommand);

    // Auto-save generation (if enabled)
    const autoGenerateDisposable = vscode.workspace.onDidSaveTextDocument(async (document) => {
        if (document.languageId !== 'lumos') {
            return;
        }

        const config = vscode.workspace.getConfiguration('lumos');
        const autoGenerate = config.get<boolean>('codeGeneration.autoGenerate', false);

        if (autoGenerate) {
            const terminal = vscode.window.createTerminal('LUMOS');
            terminal.sendText(`lumos generate ${document.fileName}`);
        }
    });

    context.subscriptions.push(autoGenerateDisposable);

    // Validation on file change
    const validationDisposable = vscode.workspace.onDidChangeTextDocument(async (event) => {
        if (event.document.languageId !== 'lumos') {
            return;
        }

        const config = vscode.workspace.getConfiguration('lumos');
        const validationEnabled = config.get<boolean>('validation.enabled', true);

        if (!validationEnabled) {
            return;
        }

        // Debounce validation (wait 500ms after last change)
        if (validationTimeout) {
            clearTimeout(validationTimeout);
        }

        validationTimeout = setTimeout(() => {
            validateDocument(event.document);
        }, 500);
    });

    // Validate on document open
    const openDocumentDisposable = vscode.workspace.onDidOpenTextDocument(async (document) => {
        if (document.languageId === 'lumos') {
            const config = vscode.workspace.getConfiguration('lumos');
            const validationEnabled = config.get<boolean>('validation.enabled', true);
            if (validationEnabled) {
                validateDocument(document);
            }
        }
    });

    // Validate on document save
    const saveDocumentDisposable = vscode.workspace.onDidSaveTextDocument(async (document) => {
        if (document.languageId === 'lumos') {
            const config = vscode.workspace.getConfiguration('lumos');
            const validationEnabled = config.get<boolean>('validation.enabled', true);
            if (validationEnabled) {
                validateDocument(document);
            }
        }
    });

    context.subscriptions.push(validationDisposable, openDocumentDisposable, saveDocumentDisposable);

    // Validate all open LUMOS documents on activation
    vscode.workspace.textDocuments.forEach(document => {
        if (document.languageId === 'lumos') {
            validateDocument(document);
        }
    });

    // Show welcome message on first activation
    const hasShownWelcome = context.globalState.get('lumos.hasShownWelcome', false);
    if (!hasShownWelcome) {
        vscode.window.showInformationMessage(
            'LUMOS extension activated! Use Ctrl+Shift+P and search for "LUMOS" to see available commands.',
            'Got it'
        ).then(() => {
            context.globalState.update('lumos.hasShownWelcome', true);
        });
    }
}

export function deactivate() {
    if (client) {
        return client.stop();
    }
}
