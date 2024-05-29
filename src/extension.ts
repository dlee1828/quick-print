// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

function escapeUnescapedQuotes(input: string): string {
  return input.replace(/([^\\])"/g, '$1\\"').replace(/^"/, '\\"');
}

const getHighlightedText = (editor: vscode.TextEditor) => {
  const selection = editor.selection;
  if (!selection || selection.isEmpty) return;
  const selectionRange = new vscode.Range(selection.start.line, selection.start.character, selection.end.line, selection.end.character);
  const highlighted = editor.document.getText(selectionRange);
  return highlighted
}

const getCurrentWord = (editor: vscode.TextEditor) => {
  if (!editor) {
    return; // No open text editor
  }

  const document = editor.document;
  const position = editor.selection.active;

  // Define a range to capture the word
  const wordRange = document.getWordRangeAtPosition(position);
  if (!wordRange) {
    return; // No word found at cursor position
  }

  const word = document.getText(wordRange);
  return word;
}

const getCurrentLinePadding = (editor: vscode.TextEditor) => {
  const startLine = editor.document.lineAt(editor.selection.start.line);
  const text = startLine.text;
  let padding = "";
  for (const chr of text) {
    if (chr == '\t' || chr == ' ') padding += chr;
    else break;
  }
  return padding
}

const applyPadding = (text: string, padding: string) => {
  // Split the text into lines
  const lines = text.split('\n');
  // Add padding to the start of each line
  const paddedLines = lines.map(line => padding + line);
  // Join the lines back together with newline characters
  return paddedLines.join('\n');
}

type LanguageConfig = {
  printVariableTemplate: string,
  printLineTemplate: string,
  printContainerTemplate: string
}

type Config = {
  cpp: LanguageConfig
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration('quickPrint');
  // Read a specific setting, for example, "mySetting"
  const printVariableTemplate = config.get<LanguageConfig>('cpp')?.printVariableTemplate ?? "std::cout << \"QP_NAME: \" << QP_VALUE << \"\\n\";\n";
  const printLineTemplate = config.get<LanguageConfig>('cpp')?.printLineTemplate ?? "std::cout << \"QP_LINE\" << \"\\n\";\n";
  const printContainerTemplate = config.get<LanguageConfig>('cpp')?.printContainerTemplate ??
    "std::cout << \"QP_NAME:\\n\";\nfor (auto element : QP_NAME) { std::cout << element << \" \"; }\nstd::cout << \"\\n\";\n";

  let quickPrintVariable = vscode.commands.registerTextEditorCommand('very-quick-print.quickPrintVariable', (editor, edit) => {
    const currentWord = getCurrentWord(editor)
    if (!currentWord) return;
    const padding = getCurrentLinePadding(editor)

    editor.selections.forEach((selection, i) => {
      const text = padding + printVariableTemplate.replace("QP_NAME", currentWord).replace("QP_VALUE", currentWord);
      const newPosition = new vscode.Position(selection.active.line + 1, 0);
      edit.insert(newPosition, text);
    })
  });

  let quickPrintLine = vscode.commands.registerTextEditorCommand('very-quick-print.quickPrintLine', (editor, edit) => {
    const selection = editor.selection;

    // Get padding at the start of the line containing selection.start
    const startLine = editor.document.lineAt(selection.start.line);
    const lineText = escapeUnescapedQuotes(startLine.text);
    const padding = getCurrentLinePadding(editor);

    const newPosition = new vscode.Position(selection.active.line + 1, 0);
    const toPrint = padding + printLineTemplate.replace("QP_LINE", lineText.trim());
    edit.insert(newPosition, toPrint);
  });

  let quickPrintContainer = vscode.commands.registerTextEditorCommand('very-quick-print.quickPrintContainer', (editor, edit) => {
    const currentWord = getCurrentWord(editor)
    if (!currentWord) return;
    const padding = getCurrentLinePadding(editor)

    editor.selections.forEach((selection, i) => {
      const text = applyPadding(printContainerTemplate.replaceAll("QP_NAME", currentWord), padding);
      const newPosition = new vscode.Position(selection.active.line + 1, 0);
      edit.insert(newPosition, text);
    })
  });


  context.subscriptions.push(quickPrintVariable);
  context.subscriptions.push(quickPrintLine);
  context.subscriptions.push(quickPrintContainer)
}

// This method is called when your extension is deactivated
export function deactivate() { }
