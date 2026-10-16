# Historical Theme Studio Notes

> These notes are incomplete and include outdated paths. Use the current [feature catalog](../docs/FEATURES.md) and [project architecture](../docs/PROJECT_ARCHITECTURE.md) for the maintained feature map.

## Archived Notes

STUDIO Logic :
Main Page > ../../ThemeStudioPage

// SDK Files
Related Files : ui.d.ts
Path : src/lib/ucp-sdk/ui.d.ts
Primary Function : This file tells the Monaco editor (the linter and compiler in the browser) that the standard UI components are available and what their shapes are.

Related Files : types.d.ts
Path : src/lib/ucp-sdk/types.d.ts
Primary Function: This is a Code Assist file designed to provide IntelliSense and auto-completion for developers using the @ucp/sdk within the Monaco Editor. It allows the editor to recognize SDK components like UCP.Text or UCP.Carousel and display their expected properties (e.g., field, default, className).


// Hooks
Related Hook : usePrecompiledTheme.ts
Path : src/hooks/usePrecompiledTheme.ts



// Components
File Name : StudioPreview
Path : 
is a dynamic preview renderer that safely loads and displays editor-generated React components using real portfolio data and a controlled module import environment.

