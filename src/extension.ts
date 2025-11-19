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

export function activate(context: vscode.ExtensionContext) {
    console.log('LUMOS extension activated');

    // Create diagnostic collection
    diagnosticCollection = vscode.languages.createDiagnosticCollection('lumos');
    context.subscriptions.push(diagnosticCollection);

    // Register auto-completion provider
    const completionProvider = vscode.languages.registerCompletionItemProvider(
        'lumos',
        new LumosCompletionProvider(),
        '.', '<', '#', '[', ':'
    );
    context.subscriptions.push(completionProvider);

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
