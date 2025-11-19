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

export function activate(context: vscode.ExtensionContext) {
    console.log('LUMOS extension activated');

    // Create diagnostic collection
    diagnosticCollection = vscode.languages.createDiagnosticCollection('lumos');
    context.subscriptions.push(diagnosticCollection);

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
