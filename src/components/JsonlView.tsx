import React, { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { JSONTree } from 'react-json-tree'

interface JsonlViewProps {
  records: unknown[]
  theme: any
  expandRows: boolean
}

// Virtualized list: only the ~visible rows are mounted, so DOM size is O(viewport),
// not O(records). Each row is one record's tree (collapsed unless "Expand All").
export const JsonlView: React.FC<JsonlViewProps> = ({
  records,
  theme,
  expandRows,
}) => {
  const parentRef = useRef<HTMLDivElement>(null)
  const virt = useVirtualizer({
    count: records.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 28,
    overscan: 12,
  })

  return (
    <div ref={parentRef} className="jsonl-view">
      <div style={{ height: virt.getTotalSize(), position: 'relative' }}>
        {virt.getVirtualItems().map((item) => (
          <div
            key={item.key}
            ref={virt.measureElement}
            data-index={item.index}
            className="jsonl-row"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${item.start}px)`,
            }}
          >
            <span className="jsonl-index">{item.index}</span>
            <div className="jsonl-record">
              <JSONTree
                key={expandRows ? 'e' : 'c'}
                data={records[item.index]}
                theme={theme}
                invertTheme={false}
                shouldExpandNodeInitially={() => expandRows}
                hideRoot={false}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
