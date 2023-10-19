import { useEffect, useRef, useState } from 'react';
import * as prettier from 'prettier';
import babelPlugin from 'prettier/plugins/babel';
import tsPlugin from 'prettier/plugins/typescript';
import estreePlugin from 'prettier/plugins/estree';
import { type HighlighterCore, getHighlighterCore } from 'shikiji/core';
import { getWasmInlined } from 'shikiji/wasm';
import Split from '@uiw/react-split';
import JsonView from 'react18-json-view';

import { DotJsAst } from './parser';
import 'react18-json-view/src/style.css';

export const App = () => {
    const shikiRef = useRef<HighlighterCore | null>(null);
    const [content, setContent] = useState(localStorage.getItem('content') ?? '');
    const [astContent, setAstContent] = useState({});
    const [tsxContent, setTsxContent] = useState('');
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        const generatePreview = async () => {
            setIsError(false);

            if (!content) {
                return;
            }

            if (!shikiRef.current) {
                shikiRef.current = await getHighlighterCore({
                    themes: [import('shikiji/themes/vitesse-light.mjs')],
                    langs: [() => import('shikiji/langs/tsx.mjs')],
                    loadWasm: getWasmInlined,
                });
            }

            try {
                setAstContent(DotJsAst.parse(content));

                const prettifiedCode = await prettier.format(DotJsAst.toJsxString(content), {
                    parser: 'babel-ts',
                    plugins: [babelPlugin, tsPlugin, estreePlugin],
                });
                const code = shikiRef.current.codeToHtml(prettifiedCode, { lang: 'tsx', theme: 'vitesse-light' });
                setTsxContent(code);
                setIsError(false);
            } catch (error) {
                setIsError(true);
            }
        };

        generatePreview().catch(console.error);
    }, [content]);

    return (
        <>
            <div className="relative flex h-16 min-h-[64px] items-center gap-4 border px-6">
                <a className="select-none text-2xl font-semibold tracking-tight transition-colors first:mt-0" href="https://alev.dev">
                    alev://
                </a>

                <div className="absolute inset-0 flex h-full w-full items-center justify-center">
                    <h3 className="text-muted-foreground text-lg sm:text-xl">doT.js to React</h3>
                </div>
            </div>

            <Split className="h-full overflow-auto">
                <div className="relative flex w-[40%] overflow-auto">
                    <textarea
                        className="flex w-full p-4 font-mono focus-within:outline-none"
                        placeholder="Enter the doT code"
                        defaultValue={content}
                        onInput={(event) => {
                            setContent((event.target as HTMLTextAreaElement).value);
                            localStorage.setItem('content', (event.target as HTMLTextAreaElement).value);
                        }}
                    ></textarea>

                    {isError ? (
                        <div className="bg-background absolute right-4 top-4 flex gap-2 rounded-lg border px-2 py-1">
                            <div className="flex items-center justify-center">
                                <div className="h-2 min-h-[8px] w-2 min-w-[8px] rounded-full bg-red-500"></div>
                            </div>

                            <span>Invalid doT.js template</span>
                        </div>
                    ) : null}
                </div>

                <Split mode="vertical" className="w-[60%]">
                    <JsonView className="flex h-[50%] w-full overflow-auto p-4" src={content ? astContent : {}} enableClipboard={false} />

                    {tsxContent ? (
                        <div
                            className="flex h-[50%] w-full [&>pre]:h-full [&>pre]:w-full [&>pre]:overflow-auto [&>pre]:p-4"
                            dangerouslySetInnerHTML={{ __html: tsxContent }}
                        ></div>
                    ) : (
                        <textarea
                            className="flex h-[50%] w-full overflow-auto p-4 font-mono focus-within:outline-none"
                            placeholder="TSX output"
                            readOnly
                        ></textarea>
                    )}
                </Split>
            </Split>
        </>
    );
};
