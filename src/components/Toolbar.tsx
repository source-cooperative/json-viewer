import React from 'react'
import type { TabType } from '../types'

interface ToolbarProps {
  activeTab: TabType
  onSave: () => void
  onCopy: () => void
  onCollapseAll: () => void
  onExpandAll: () => void
  disableExpandAll: boolean
  isPrettyPrinted: boolean
  onTogglePrettyPrint: () => void
}

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTab,
  onSave,
  onCopy,
  onCollapseAll,
  onExpandAll,
  disableExpandAll,
  isPrettyPrinted,
  onTogglePrettyPrint,
}) => (
  <div className="toolbar">
    <div className="toolbar-buttons">
      <button onClick={onSave}>Save</button>
      <button onClick={onCopy}>Copy</button>
      {activeTab === 'json' ? (
        <>
          <button onClick={onCollapseAll}>Collapse All</button>
          <button
            onClick={onExpandAll}
            disabled={disableExpandAll}
            title={
              disableExpandAll
                ? 'File too large to expand all at once'
                : undefined
            }
          >
            Expand All
          </button>
        </>
      ) : (
        <button onClick={onTogglePrettyPrint}>
          {isPrettyPrinted ? 'Minify' : 'Pretty Print'}
        </button>
      )}
    </div>
  </div>
)
