export type AppState =
  | { type: 'no-url' }
  | { type: 'loading'; url: string }
  | { type: 'error'; url: string; error: string }
  | { type: 'success'; url: string; mode: 'json'; data: any; jsonText: string }
  | { type: 'success'; url: string; mode: 'jsonl'; records: any[] }

export type TabType = 'json' | 'raw' | 'stac'

export type ThemeType = 'light' | 'dark' | undefined

// Declare the custom element for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'openeo-stac': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >
    }
  }
}
