// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration('quickPrint');
  // Read a specific setting, for example, "mySetting"
  const printVariableTemplate = config.get<{ cpp: string }>('printVariableTemplates')?.cpp ?? "std::cout << QP_NAME << \": \" << QP_VALUE << \"\\n\";\n";
  const printLineTemplate = config.get<{ cpp: string }>('printLineTemplates')?.cpp ?? "std::cout << QP_LINE << \"\\n\";\n";

  let quickPrintVariable = vscode.commands.registerTextEditorCommand('quick-print.quickPrintVariable', (editor, edit) => {
    const selection = editor.selection;
    if (!selection || selection.isEmpty) return;
    const selectionRange = new vscode.Range(selection.start.line, selection.start.character, selection.end.line, selection.end.character);
    const highlighted = editor.document.getText(selectionRange);

    // Get padding at the start of the line containing selection.start
    const startLine = editor.document.lineAt(selection.start.line);
    const text = startLine.text;
    let padding = "";
    for (const chr of text) {
      if (chr == '\t' || chr == ' ') padding += chr;
      else break;
    }

    editor.selections.forEach((selection, i) => {
      const text = padding + printVariableTemplate.replace("QP_NAME", highlighted).replace("QP_VALUE", highlighted);
      const newPosition = new vscode.Position(selection.active.line + 1, 0);
      edit.insert(newPosition, text);
    })

    const position = editor.selection.active;
    const newSelection = new vscode.Selection(position, position);
    editor.selection = newSelection;
  });

  let quickPrintLine = vscode.commands.registerTextEditorCommand('quick-print.quickPrintLine', (editor, edit) => {
    const selection = editor.selection;

    // Get padding at the start of the line containing selection.start
    const startLine = editor.document.lineAt(selection.start.line);
    const lineText = startLine.text;
    let padding = "";
    for (const chr of lineText) {
      if (chr == '\t' || chr == ' ') padding += chr;
      else break;
    }


    const newPosition = new vscode.Position(selection.active.line + 1, 0);
    const toPrint = padding + printLineTemplate.replace("QP_LINE", lineText.trim());
    edit.insert(newPosition, toPrint);

    const position = editor.selection.active;
    const newSelection = new vscode.Selection(position, position);
    editor.selection = newSelection;
  });


  context.subscriptions.push(quickPrintVariable);
  context.subscriptions.push(quickPrintLine);
}

// This method is called when your extension is deactivated
export function deactivate() { }
