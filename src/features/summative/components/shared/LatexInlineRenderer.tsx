'use client';

import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface LatexInlineRendererProps {
    text: string;
    className?: string;
}

const LATEX_PATTERN = /(\$\$[^$]+\$\$|\$[^$\n]+\$)/g;

export const LatexInlineRenderer: React.FC<LatexInlineRendererProps> = ({ text, className }) => {
    const segments = useMemo(() => {
        const source = text || '';
        const parts = source.split(LATEX_PATTERN).filter((part) => part.length > 0);

        return parts.map((part, idx) => {
            const isBlock = part.startsWith('$$') && part.endsWith('$$');
            const isInline = part.startsWith('$') && part.endsWith('$');

            if (!isBlock && !isInline) {
                return (
                    <span key={`txt-${idx}`} className="whitespace-pre-wrap">
                        {part}
                    </span>
                );
            }

            const expression = isBlock ? part.slice(2, -2) : part.slice(1, -1);
            const html = katex.renderToString(expression, {
                throwOnError: false,
                strict: 'ignore',
                displayMode: isBlock,
            });

            return (
                <span
                    key={`math-${idx}`}
                    className={isBlock ? 'block my-2' : 'inline'}
                    dangerouslySetInnerHTML={{ __html: html }}
                />
            );
        });
    }, [text]);

    return <span className={className}>{segments}</span>;
};

