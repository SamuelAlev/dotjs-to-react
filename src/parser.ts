import { MAPPED_ATTRIBUTES_TO_JSX, REGEXES } from './constants';

type Children = (Element | Comment | Text | Attribute | DotIterator | DotConditional | DotEncoded | DotEvaluated | DotInterpolated)[];

type Parent = {
    children: Children;
};

type Literal = {
    value: string;
};

type Root = {
    type: 'root';
} & Parent;

type Comment = {
    type: 'comment';
} & Literal;

type Text = {
    type: 'text';
} & Literal;

type DotEncoded = {
    type: 'dotEncoded';
} & Literal;

type DotEvaluated = {
    type: 'dotEvaluated';
} & Literal;

type DotInterpolated = {
    type: 'dotInterpolated';
} & Literal;

type DotIterator = {
    type: 'dotIterator';
    iteratedVariableName: string;
    currentIterationVariableName: string;
    currentIterationIndexVariableName: string;
} & Parent;

type DotConditional = {
    type: 'dotConditional';
    test: string;
    alternate?: Children;
} & Parent;

type Attribute = {
    type: 'attribute';
    name: string;
} & Parent;

type Element = {
    type: 'element';
    tagName: string;
    attributes: Children;
    content?: Root;
} & Parent;

type ParserEvent =
    | 'openTag'
    | 'closeTag'
    | 'text'
    | 'comment'
    | 'startReadingAttributes'
    | 'stopReadingAttributes'
    | 'openAttribute'
    | 'closeAttribute'
    | 'dotEncoded'
    | 'dotInterpolated'
    | 'dotEvaluated'
    | 'openDotConditional'
    | 'openDotIterator'
    | 'closeDotIterator'
    | 'closeDotConditional'
    | 'dotConditionalElseIf'
    | 'dotConditionalElse';

type EventHandler<EventName extends ParserEvent> = {
    openTag: (tagName: string) => void;
    closeTag: (tagName: string) => void;
    text: (text: string) => void;
    comment: (comment: string) => void;
    startReadingAttributes: () => void;
    stopReadingAttributes: () => void;
    openAttribute: (name: string) => void;
    closeAttribute: () => void;
    dotEncoded: (value: string) => void;
    dotInterpolated: (value: string) => void;
    dotEvaluated: (value: string) => void;
    openDotIterator: (
        iteratedVariableName: string,
        currentIterationVariableName: string,
        currentIterationIndexVariableName: string,
    ) => void;
    closeDotIterator: () => void;
    openDotConditional: (test: string) => void;
    closeDotConditional: () => void;
    dotConditionalElseIf: (test: string) => void;
    dotConditionalElse: () => void;
}[EventName];

class Parser {
    // HTML
    private onOpenTag?: EventHandler<'openTag'>;
    private onCloseTag?: EventHandler<'closeTag'>;
    private onText?: EventHandler<'text'>;
    private onComment?: EventHandler<'comment'>;

    // Attributes
    private onStartReadingAttributes?: EventHandler<'startReadingAttributes'>;
    private onStopReadingAttributes?: EventHandler<'stopReadingAttributes'>;
    private onOpenAttribute?: EventHandler<'openAttribute'>;
    private onCloseAttribute?: EventHandler<'closeAttribute'>;

    // Dot basics
    private onDotEncoded?: EventHandler<'dotEncoded'>;
    private onDotEvaluated?: EventHandler<'dotEvaluated'>;
    private onDotInterpolated?: EventHandler<'dotInterpolated'>;

    // Dot iterator
    private onOpenDotIterator?: EventHandler<'openDotIterator'>;
    private onCloseDotIterator?: EventHandler<'closeDotIterator'>;

    // Dot conditional
    private onOpenDotConditional?: EventHandler<'openDotConditional'>;
    private onCloseDotConditional?: EventHandler<'closeDotConditional'>;
    private onDotConditionalElseIf?: EventHandler<'dotConditionalElseIf'>;
    private onDotConditionalElse?: EventHandler<'dotConditionalElse'>;

    // eslint-disable-next-line no-useless-constructor
    constructor(private readonly text: string) {}

    parse() {
        let position = 0;
        let isReadingAttributes = false;
        let inAttributeValueReadingMode = false;

        while (position < this.text.length) {
            // console.log('text:', this.text.substring(position));

            if (this.text[position] === '<' && this.text[position + 1] === '/') {
                // Close Pair Tag (<div></div>)
                //                      ^^^^^^ this is skipped and emit closeTag event
                const closeTagEnd = this.text.indexOf('>', position + 1);
                const closeTag = this.text.slice(position + 2, closeTagEnd);

                isReadingAttributes = false;
                this.emitCloseTag(closeTag);

                position = closeTagEnd + 1;
            } else if (this.text[position] === '>') {
                // Close first of Pair Tag (<div>[...]</div>)
                //                              ^ this symbol is skipped, emits closeAttribute event if open

                isReadingAttributes = false;
                this.emitStopReadingAttributes();
                position += 1;
            } else if (this.text[position] === '<' && this.text[position + 1] === '!') {
                // Comment
                const commentEnd = this.text.indexOf('-->', position + 1);
                const comment = this.text.slice(position + 4, commentEnd);

                this.emitComment(comment);

                position = commentEnd + 1;
            } else if (this.text[position] === '<') {
                // Start Tag (<img [...] />)
                //            ^^^^ this is skipped, emit openTag and start reading attributes events
                if (this.text[position + 1] === '{' && this.text[position + 2] === '{') {
                    throw new Error(
                        'Parser not handling dot expression right after a tag opening. You can create a dynamic tag by following this: "https://stackoverflow.com/a/70563918".',
                    );
                }

                const openTagEndPositionSpace = this.text.indexOf(' ', position + 1);
                const openTagEndPositionSlash = this.text.indexOf('/', position + 1);
                const openTagEndPositionCaret = this.text.indexOf('>', position + 1);
                const openTagEnd = Math.min(
                    openTagEndPositionSpace !== -1 ? openTagEndPositionSpace : Infinity,
                    openTagEndPositionCaret !== -1 ? openTagEndPositionCaret : Infinity,
                    openTagEndPositionSlash !== -1 ? openTagEndPositionSlash : Infinity,
                );

                const openTag = this.text.slice(position + 1, openTagEnd);
                const tagName = this.parseOpenTag(openTag);

                isReadingAttributes = true;
                this.emitOpenTag(tagName);
                this.emitStartReadingAttributes();

                position = openTagEnd;
            } else if (
                isReadingAttributes &&
                !inAttributeValueReadingMode &&
                this.text[position] === '/' &&
                this.text[position + 1] === '>'
            ) {
                // Close Selfclosing Tag (<img [...] />)
                //                                   ^^ this is skipped and emit closeTag event
                const tagNameStart = this.text.lastIndexOf('<', position - 1);

                const tagNameEndSpacePosition = this.text.indexOf(' ', tagNameStart + 1);
                const tagNameEndSlashPosition = this.text.indexOf('/', tagNameStart + 1);
                const tagNameEnd = Math.min(
                    tagNameEndSpacePosition !== -1 ? tagNameEndSpacePosition : Infinity,
                    tagNameEndSlashPosition !== -1 ? tagNameEndSlashPosition : Infinity,
                );

                isReadingAttributes = false;
                this.emitStopReadingAttributes();
                this.emitCloseTag(this.text.substring(tagNameStart + 1, tagNameEnd));

                position += 2;
            } else if (this.text[position] === '{' && this.text[position + 1] === '{') {
                // Dot expressions
                const expressionEnd = this.text.indexOf('}}', position + 2);
                const expression = this.text.slice(position, expressionEnd + 2).trim();

                if (expression.startsWith('{{=')) {
                    // Interpolate
                    const output = [...expression.matchAll(REGEXES.interpolate)];
                    const variable = output[0][1]?.trim();
                    this.emitDotInterpolated(variable);
                } else if (expression.startsWith('{{!')) {
                    // Encode
                    const output = [...expression.matchAll(REGEXES.encode)];
                    const variable = output[0][1]?.trim();
                    this.emitDotEncoded(variable);
                } else if (expression.startsWith('{{?')) {
                    // Conditional
                    const output = [...expression.matchAll(REGEXES.conditional)];
                    const elsecase = output[0][1]?.trim();
                    const condition = output[0][2]?.trim();
                    if (elsecase) {
                        // Else if/else case
                        condition ? this.emitDotConditionalElseIf(condition) : this.emitDotConditionalElse();
                    } else {
                        // If case (open and close)
                        condition ? this.emitOpenDotConditional(condition) : this.emitCloseDotConditional();
                    }
                } else if (expression.startsWith('{{~')) {
                    // Iterate
                    const output = [...expression.matchAll(REGEXES.iterate)];
                    const iteratedVariableName = output[0][1]?.trim();
                    const currentIterationVariableName = output[0][2]?.trim();
                    const currentIterationIndexVariableName = output[0][3]?.trim();

                    if (iteratedVariableName) {
                        this.emitOpenDotIterator(iteratedVariableName, currentIterationVariableName, currentIterationIndexVariableName);
                    } else {
                        this.emitCloseDotIterator();
                    }
                } else if (expression.startsWith('{{')) {
                    // Evaluate
                    const output = [...expression.matchAll(REGEXES.evaluate)];
                    const variable = output[0][1].trim();
                    this.emitDotEvaluated(variable);
                }

                // Skip the full expression (including the closing `}}`)
                position = expressionEnd + 2;
            } else if (
                isReadingAttributes &&
                !inAttributeValueReadingMode &&
                this.text[position] !== ' ' &&
                this.text[position + 1] !== '/' &&
                this.text[position + 1] !== '{'
            ) {
                // Attribute Open or self closing attribute (<div class="foo" controls>)
                //                                                ^^^^^^^     ^^^^^^^^
                //                                    these are skipped and emit openAttribute event,
                //                                    if self closing, directly emit closeAttribute event
                const attributeName = this.text.substring(position).match(/^[\w-]*/)?.[0];
                if (!attributeName) {
                    throw new Error('Attribute name not found');
                }

                const attributeNameEndPosition = position + attributeName.length;
                const isFollowedByAttributeValue = this.text.substring(attributeNameEndPosition).startsWith('="');

                inAttributeValueReadingMode = true;
                this.emitOpenAttribute(attributeName);

                if (
                    !isFollowedByAttributeValue &&
                    (this.text[attributeNameEndPosition] === ' ' || this.text[attributeNameEndPosition] === '>')
                ) {
                    inAttributeValueReadingMode = false;
                    this.emitCloseAttribute();
                }

                position = attributeNameEndPosition + (isFollowedByAttributeValue ? 2 : 0);
            } else if (isReadingAttributes && inAttributeValueReadingMode && this.text[position] === '"') {
                // Attribute Close (<div class="foo" for="id">)
                //                                 ^ we are here and emit closeAttribute event
                inAttributeValueReadingMode = false;
                this.emitCloseAttribute();
                position += 1;
            } else if (!isReadingAttributes || (isReadingAttributes && inAttributeValueReadingMode)) {
                // Text node or attribute value until next {{ or < or " (dot, tag opening or attribute closing)
                const textEndPositionDot = this.text.indexOf('{{', position + 1);
                const textEndPositionTag = this.text.indexOf('<', position + 1);
                const textEndPositionDoubleQuote = this.text.indexOf('"', position + 1);
                const textEnd = Math.min(
                    textEndPositionDot !== -1 ? textEndPositionDot : Infinity,
                    textEndPositionTag !== -1 ? textEndPositionTag : Infinity,
                    textEndPositionDoubleQuote !== -1 && inAttributeValueReadingMode ? textEndPositionDoubleQuote : Infinity,
                );

                const text = this.text.slice(position, textEnd);
                this.emitText(text);
                position = textEnd;
            } else {
                // Nothing matched, skip this symbol
                position += 1;
            }
        }
    }

    on<Key extends ParserEvent>(event: Key, callback: EventHandler<Key>): void {
        const eventHandlers: Record<ParserEvent, string> = {
            openTag: 'onOpenTag',
            closeTag: 'onCloseTag',
            text: 'onText',
            comment: 'onComment',
            startReadingAttributes: 'onStartReadingAttributes',
            stopReadingAttributes: 'onStopReadingAttributes',
            openAttribute: 'onOpenAttribute',
            closeAttribute: 'onCloseAttribute',
            dotEncoded: 'onDotEncoded',
            dotInterpolated: 'onDotInterpolated',
            dotEvaluated: 'onDotEvaluated',
            openDotIterator: 'onOpenDotIterator',
            closeDotIterator: 'onCloseDotIterator',
            openDotConditional: 'onOpenDotConditional',
            closeDotConditional: 'onCloseDotConditional',
            dotConditionalElseIf: 'onDotConditionalElseIf',
            dotConditionalElse: 'onDotConditionalElse',
        };

        const eventHandler = eventHandlers[event];
        if (eventHandler) {
            (this as Record<typeof eventHandler, EventHandler<Key>>)[eventHandler] = callback;
        }
    }

    private parseOpenTag(openTag: string): string {
        const parts = openTag.split(/ (?=(?:(?:[^"]*"){2})*[^"]*$)/);
        const tagName = parts.shift() as string;
        return tagName;
    }

    private emitOpenTag(tagName: string): void {
        this.onOpenTag?.(tagName);
    }

    private emitCloseTag(tagName: string): void {
        this.onCloseTag?.(tagName);
    }

    private emitText(text: string): void {
        this.onText?.(text);
    }

    private emitComment(comment: string): void {
        this.onComment?.(comment);
    }

    private emitStartReadingAttributes() {
        this.onStartReadingAttributes?.();
    }

    private emitStopReadingAttributes() {
        this.onStopReadingAttributes?.();
    }

    private emitOpenAttribute(name: string) {
        this.onOpenAttribute?.(name);
    }

    private emitCloseAttribute() {
        this.onCloseAttribute?.();
    }

    private emitOpenDotIterator(
        iteratedVariableName: string,
        currentIterationVariableName: string,
        currentIterationIndexVariableName: string,
    ) {
        this.onOpenDotIterator?.(iteratedVariableName, currentIterationVariableName, currentIterationIndexVariableName);
    }

    private emitCloseDotIterator() {
        this.onCloseDotIterator?.();
    }

    private emitDotEncoded(value: string) {
        this.onDotEncoded?.(value);
    }

    private emitDotInterpolated(value: string) {
        this.onDotInterpolated?.(value);
    }

    private emitDotEvaluated(value: string) {
        this.onDotEvaluated?.(value);
    }

    private emitOpenDotConditional(condition: string) {
        this.onOpenDotConditional?.(condition);
    }

    private emitCloseDotConditional() {
        this.onCloseDotConditional?.();
    }

    private emitDotConditionalElseIf(condition: string) {
        this.onDotConditionalElseIf?.(condition);
    }

    private emitDotConditionalElse() {
        this.onDotConditionalElse?.();
    }
}

export class DotJsAst {
    public static parse(template: string): Root {
        const astRoot: Root = {
            type: 'root',
            children: [],
        };

        const nodeStack: (Root | Element | DotConditional | DotIterator | Attribute)[] = [astRoot];
        let currentNode: Root | Element | DotConditional | DotIterator | Attribute = astRoot;

        const alternateModeNodesMap = new Map([]);
        const readingAttributesModeNodesMap = new Map([]);

        // Remove linebreaks
        const cleanedTemplate = template.replaceAll(REGEXES.linebreak1, ' ').replaceAll(REGEXES.linebreak2, '');

        console.log('Cleaned template:', cleanedTemplate);

        const parser = new Parser(cleanedTemplate);

        parser.on('openTag', (tagName) => {
            console.log('openTag', tagName);
            const node: Element = {
                type: 'element',
                tagName,
                attributes: [],
                children: [],
            };

            if (currentNode.type === 'dotConditional' && alternateModeNodesMap.has(currentNode)) {
                currentNode.alternate = [...(currentNode.alternate ?? []), node];
            } else {
                currentNode.children.push(node);
            }

            nodeStack.push(node);
            currentNode = node;
        });

        parser.on('closeTag', (tagName) => {
            console.log('closeTag', tagName);

            // Remove current node from stack and go back to the previous one
            nodeStack.pop();
            const lastItem = nodeStack.at(-1);
            if (!lastItem) {
                throw new Error('Stack is empty.');
            }
            currentNode = lastItem;
        });

        parser.on('text', (text) => {
            console.log('text', text);
            const node: Text = {
                type: 'text',
                value: text,
            };

            if (currentNode.type === 'dotConditional' && alternateModeNodesMap.has(currentNode)) {
                currentNode.alternate = [...(currentNode.alternate ?? []), node];
            } else {
                currentNode.children.push(node);
            }
        });

        parser.on('comment', (comment) => {
            console.log('comment', comment);
            const node: Comment = {
                type: 'comment',
                value: comment,
            };

            if (currentNode.type === 'dotConditional' && alternateModeNodesMap.has(currentNode)) {
                currentNode.alternate = [...(currentNode.alternate ?? []), node];
            } else {
                currentNode.children.push(node);
            }
        });

        parser.on('startReadingAttributes', () => {
            console.log('startReadingAttributes');

            readingAttributesModeNodesMap.set(currentNode, true);
        });

        parser.on('stopReadingAttributes', () => {
            console.log('stopReadingAttributes');

            readingAttributesModeNodesMap.delete(currentNode);
        });

        parser.on('openAttribute', (name) => {
            console.log('openAttribute', name);
            const node: Attribute = {
                type: 'attribute',
                name,
                children: [],
            };

            if (currentNode.type === 'dotConditional' && alternateModeNodesMap.has(currentNode)) {
                currentNode.alternate = [...(currentNode.alternate ?? []), node];
            } else if (currentNode.type !== 'element') {
                currentNode.children.push(node);
            } else {
                currentNode.attributes.push(node);
            }
            currentNode = node;
            nodeStack.push(currentNode);
        });

        parser.on('closeAttribute', () => {
            console.log('closeAttribute');
            if (currentNode.type === 'attribute') {
                nodeStack.pop();
                const lastItem = nodeStack.at(-1);
                if (!lastItem) {
                    throw new Error('Stack is empty.');
                }
                currentNode = lastItem;
            }
        });

        parser.on('dotEncoded', (value) => {
            console.log('dotEncoded', value);
            const node: DotEncoded = {
                type: 'dotEncoded',
                value,
            };

            if (readingAttributesModeNodesMap.get(currentNode) === true && currentNode.type === 'element') {
                currentNode.attributes.push(node);
            } else if (currentNode.type === 'dotConditional' && alternateModeNodesMap.has(currentNode)) {
                currentNode.alternate = [...(currentNode.alternate ?? []), node];
            } else {
                currentNode.children.push(node);
            }
        });

        parser.on('dotInterpolated', (value) => {
            console.log('dotInterpolated', value);
            const node: DotInterpolated = {
                type: 'dotInterpolated',
                value,
            };

            if (readingAttributesModeNodesMap.get(currentNode) === true && currentNode.type === 'element') {
                currentNode.attributes.push(node);
            } else if (currentNode.type === 'dotConditional' && alternateModeNodesMap.has(currentNode)) {
                currentNode.alternate = [...(currentNode.alternate ?? []), node];
            } else {
                currentNode.children.push(node);
            }
        });

        parser.on('dotEvaluated', (value) => {
            console.log('dotEvaluated', value);
            const node: DotEvaluated = {
                type: 'dotEvaluated',
                value,
            };

            if (readingAttributesModeNodesMap.get(currentNode) === true && currentNode.type === 'element') {
                currentNode.attributes.push(node);
            } else if (currentNode.type === 'dotConditional' && alternateModeNodesMap.has(currentNode)) {
                currentNode.alternate = [...(currentNode.alternate ?? []), node];
            } else {
                currentNode.children.push(node);
            }
        });

        parser.on('openDotIterator', (iteratedVariableName, currentIterationVariableName, currentIterationIndexVariableName) => {
            console.log('openDotIterator', iteratedVariableName, currentIterationVariableName, currentIterationIndexVariableName);

            const node: DotIterator = {
                type: 'dotIterator',
                iteratedVariableName,
                currentIterationVariableName,
                currentIterationIndexVariableName,
                children: [],
            };

            if (readingAttributesModeNodesMap.get(currentNode) === true && currentNode.type === 'element') {
                currentNode.attributes.push(node);
            } else if (currentNode.type === 'dotConditional' && alternateModeNodesMap.has(currentNode)) {
                currentNode.alternate = [...(currentNode.alternate ?? []), node];
            } else {
                currentNode.children.push(node);
            }
            nodeStack.push(node);
            currentNode = node;
        });

        parser.on('closeDotIterator', () => {
            console.log('closeDotIterator');

            // Remove current node from stack and go back to the previous one
            nodeStack.pop();
            const lastItem = nodeStack.at(-1);
            if (!lastItem) {
                throw new Error('Stack is empty.');
            }
            currentNode = lastItem;
        });

        parser.on('openDotConditional', (test) => {
            console.log('openDotConditional', test);

            const node: DotConditional = {
                type: 'dotConditional',
                test,
                children: [],
            };

            if (readingAttributesModeNodesMap.get(currentNode) === true && currentNode.type === 'element') {
                currentNode.attributes.push(node);
            } else if (currentNode.type === 'dotConditional' && alternateModeNodesMap.has(currentNode)) {
                currentNode.alternate = [...(currentNode.alternate ?? []), node];
            } else {
                currentNode.children.push(node);
            }
            nodeStack.push(node);
            currentNode = node;
        });

        parser.on('dotConditionalElseIf', (test) => {
            console.log('dotConditionalElseIf', test);
            if (currentNode.type !== 'dotConditional') {
                throw new Error('Unexpected dotConditionalElseIf.');
            }
            const node: DotConditional = {
                type: 'dotConditional',
                test,
                children: [],
            };

            currentNode.alternate = [...(currentNode.alternate ?? []), node];
            nodeStack.pop();
            nodeStack.push(node);
            currentNode = node;
        });

        parser.on('dotConditionalElse', () => {
            console.log('dotConditionalElse');

            if (currentNode.type !== 'dotConditional') {
                throw new Error('Unexpected dotConditionalElse.');
            }

            alternateModeNodesMap.set(currentNode, true);
        });

        parser.on('closeDotConditional', () => {
            console.log('closeDotConditional');

            alternateModeNodesMap.set(currentNode, false);

            // Remove current node from stack and go back to the previous one
            nodeStack.pop();
            const lastItem = nodeStack.at(-1);
            if (!lastItem) {
                throw new Error('Stack is empty.');
            }
            currentNode = lastItem;
        });

        parser.parse();

        return astRoot;
    }

    public static toJsxString(template: string): string {
        console.log('Input template:');
        console.log(template);

        const ast = DotJsAst.parse(template);

        console.log('Generated AST:');
        console.log(JSON.stringify(ast, null, 2));

        const imports: Set<string> = new Set();
        const beforeFunctionReturn: string[] = [];

        function traverse(
            node: Root | Children[0],
            parentNode?: Root | Children[0],
            options: { inDotAttribute: boolean } = { inDotAttribute: false },
        ): string {
            const parentNodeChildren =
                parentNode && 'children' in parentNode
                    ? parentNode.children.filter((child) => child.type !== 'text' || child.value.trim() !== '')
                    : [];

            const parentNodeAlternate =
                parentNode && 'alternate' in parentNode
                    ? parentNode.alternate?.filter((child) => child.type !== 'text' || child.value.trim() !== '') ?? []
                    : [];

            if (node.type === 'root') {
                const result = node.children
                    .filter((child) => child.type !== 'text' || child.value.trim() !== '')
                    .map((child) => traverse(child, node));

                // If there are multiple children or if there are dot expressions, wrap them in a fragment
                if (result.length > 1) {
                    return `<>${result.join('')}</>`;
                }
                return result[0];
            } else if (node.type === 'element') {
                const mappedAttributes = node.attributes
                    .map((child) => traverse(child, node, { inDotAttribute: child.type.includes('dot') }))
                    .join(' ');

                const children = node.children
                    .filter((child) => child.type !== 'text' || child.value.trim() !== '')
                    .map((child) => traverse(child, node))
                    .join('');

                return `<${node.tagName}${mappedAttributes ? ` ${mappedAttributes}` : ''}>${children}</${node.tagName}>`;
            } else if (node.type === 'attribute') {
                const attributeName = MAPPED_ATTRIBUTES_TO_JSX[node.name] ?? node.name;

                // Single attribute without values: controls, checked, disabled, etc.
                if (node.children.length === 0) {
                    return `${attributeName}`;
                }

                // In case of `style`, we need to convert the value from string to an object
                if (node.name === 'style') {
                    const getStyleObjectOfValidStyleString = (styleString: string): Record<string, string> => {
                        return styleString.split(';').reduce((styleObject, style) => {
                            const colonPosition = style.indexOf(':');

                            if (colonPosition === -1) {
                                return styleObject;
                            }

                            const camelCaseProperty = style
                                .substring(0, colonPosition)
                                .trim()
                                .replace(/^-ms-/, 'ms-')
                                .replaceAll(/-./g, (minusAndLetter) => minusAndLetter[1].toUpperCase());
                            const value = style.substring(colonPosition + 1).trim();

                            return value ? { ...styleObject, [camelCaseProperty]: value } : styleObject;
                        }, {});
                    };

                    const getStyleObjectAsString = (styleAttributeNode: Attribute): string => {
                        if (styleAttributeNode.children.length === 0) {
                            return '{}';
                        }

                        // Simple case it is just a string without any dot expressions
                        if (styleAttributeNode.children.length === 1 && styleAttributeNode.children[0].type === 'text') {
                            const styleObject = getStyleObjectOfValidStyleString(styleAttributeNode.children[0].value);
                            return JSON.stringify(styleObject);
                        }

                        return DotJsAst.childrenToStyle(styleAttributeNode);
                    };

                    if (parentNode?.type === 'element') {
                        return `${attributeName}={${getStyleObjectAsString(node)}}`;
                    }

                    return ` "${attributeName}": ${getStyleObjectAsString(node)} `;
                }

                const getValuesFromChildren = (attributeChildren: Children): string[] =>
                    attributeChildren.map((attributeChild) => {
                        switch (attributeChild.type) {
                            case 'text': {
                                return attributeChild.value;
                            }

                            case 'dotEvaluated':
                            case 'dotInterpolated':
                            case 'dotEncoded': {
                                return `\${${attributeChild.value}}`;
                            }

                            case 'dotIterator': {
                                if (attributeChild.children.some((iteratorChild) => iteratorChild.type === 'element')) {
                                    throw new Error('Iterate over Element not implemented.');
                                }

                                const iteratorChildren = getValuesFromChildren(attributeChild.children);

                                // Represent (item, index)
                                //            ^^^^^^^^^^^ these in the iterator expression
                                const iteratorParametersExpression = `${attributeChild.currentIterationVariableName}${
                                    attributeChild.currentIterationIndexVariableName
                                        ? `, ${attributeChild.currentIterationIndexVariableName}`
                                        : ''
                                }`;

                                return `\${${
                                    attributeChild.iteratedVariableName
                                }?.map((${iteratorParametersExpression}) => \`${iteratorChildren.join('')}\`)}`;
                            }

                            case 'dotConditional': {
                                return `\${${attributeChild.test} ? \`${
                                    getValuesFromChildren(attributeChild.children).join('') || ''
                                }\` : \`${
                                    attributeChild.alternate ? getValuesFromChildren(attributeChild.alternate).join('') || '' : ''
                                }\`}`;
                            }

                            default: {
                                throw new Error(`Unexpected node type in attribute: ${node.type}`);
                            }
                        }
                    });

                if (options.inDotAttribute) {
                    const wrappedAttributeNameIfNecessary = attributeName.includes('-') ? `"${attributeName}"` : attributeName;

                    // If the attribute has only one dot expression, we can just use it without wrapping it in backtick
                    if (
                        node.children.length === 1 &&
                        (node.children[0].type === 'dotEncoded' ||
                            node.children[0].type === 'dotInterpolated' ||
                            node.children[0].type === 'dotConditional')
                    ) {
                        return `${wrappedAttributeNameIfNecessary}: ${traverse(node.children[0], node, {
                            inDotAttribute: true,
                        })}`;
                    }

                    return `${wrappedAttributeNameIfNecessary}: "${node.children.map((child) => traverse(child, node)).join(' ')}"`;
                } else if (node.children.every((child) => child.type === 'text')) {
                    // If the attribute has only text children, we can just join them
                    return `${attributeName}="${(node.children as Text[]).map((child) => child.value).join(' ')}"`;
                } else if (
                    // If the attribute has only one dot expression, we can just use it without wrapping it in backtick
                    node.children.length === 1 &&
                    (node.children[0].type === 'dotEncoded' || node.children[0].type === 'dotInterpolated')
                ) {
                    const value = node.children[0].value;
                    return `${attributeName}={${value}}`;
                }

                return `${attributeName}={\`${getValuesFromChildren(node.children).join('')}\`}`;
            } else if (node.type === 'text') {
                return node.value;
            } else if (node.type === 'dotEncoded') {
                const expression = node.value;

                if (parentNode?.type === 'root' && parentNode?.children.length === 1) {
                    // At root level, we don't need to wrap with Fragment or mustaches if only child
                    return expression;
                } else if (
                    options.inDotAttribute &&
                    parentNode?.type === 'attribute' &&
                    parentNodeChildren.length === 1 &&
                    parentNodeChildren.includes(node)
                ) {
                    return expression;
                } else if (parentNode?.type === 'element') {
                    return `{${expression}}`;
                } else if (
                    parentNode?.type === 'dotConditional' &&
                    ((parentNodeChildren.length === 1 && parentNodeChildren.includes(node)) ||
                        (parentNodeAlternate.length === 1 && parentNodeAlternate.includes(node)))
                ) {
                    return expression;
                } else if (parentNodeChildren.length === 1) {
                    // In case of single child, we provide a cleaner output
                    return `{${expression}}`;
                }

                return `<>{${expression}}</>`;
            } else if (node.type === 'dotInterpolated') {
                imports.add('import parseHtml from "html-react-parser";');

                if (node.value.includes('it.tpl.render')) {
                    // TODO: handle component imports
                }

                const expression = `parseHtml(${node.value})`;

                if (parentNode?.type === 'root' && parentNodeChildren.length === 1) {
                    // At root level, we don't need to wrap with Fragment or mustaches if only child
                    return expression;
                } else if (
                    options.inDotAttribute &&
                    parentNode?.type === 'attribute' &&
                    parentNodeChildren.length === 1 &&
                    parentNodeChildren.includes(node)
                ) {
                    return expression;
                } else if (parentNode?.type === 'element') {
                    return `{${expression}}`;
                } else if (parentNode?.type === 'dotIterator' && parentNodeChildren.length === 1) {
                    return expression;
                } else if (
                    parentNode?.type === 'dotConditional' &&
                    ((parentNodeChildren.length === 1 && parentNodeChildren.includes(node)) ||
                        (parentNodeAlternate.length === 1 && parentNodeAlternate.includes(node)))
                ) {
                    return expression;
                } else if (parentNodeChildren.length === 1) {
                    // In case of single child, we provide a cleaner output
                    return `{${expression}}`;
                }

                return `<>{${expression}}</>`;
            } else if (node.type === 'dotConditional') {
                const inDotAttribute = (parentNode?.type === 'element' && parentNode.attributes.includes(node)) || options.inDotAttribute;

                const children = node.children
                    .filter((child) => child.type !== 'text' || child.value.trim() !== '')
                    .map((child) => traverse(child, node, { inDotAttribute }));

                const alternate =
                    node.alternate
                        ?.filter((child) => child.type !== 'text' || child.value.trim() !== '')
                        .map((child) => traverse(child, node)) ?? [];

                const childrenExpression = node.children?.every((child) => child.type === 'text')
                    ? `"${children.join('')}"`
                    : children.length > 1
                      ? `<>${children.join('')}</>`
                      : // eslint-disable-next-line unicorn/no-nested-ternary
                        children.length === 1
                        ? `${children.join('')}`
                        : 'null';

                const alternateExpression = node.alternate?.every((child) => child.type === 'text')
                    ? `"${alternate.join('')}"`
                    : alternate.length > 1
                      ? `<>${alternate.join('')}</>`
                      : // eslint-disable-next-line unicorn/no-nested-ternary
                        alternate.length === 1
                        ? `${alternate.join('')}`
                        : 'null';

                const expression = `${node.test} ? ${childrenExpression} : ${alternateExpression}`;

                if (parentNode?.type === 'root' && parentNodeChildren.length === 1) {
                    // At root level, we don't need to wrap with Fragment or mustaches if only child
                    return expression;
                } else if (
                    inDotAttribute &&
                    parentNode?.type === 'attribute' &&
                    parentNodeChildren.length === 1 &&
                    parentNodeChildren.includes(node)
                ) {
                    return expression;
                } else if (inDotAttribute) {
                    return `{...(${node.test} ? {${children.join(', ')}} : {${alternate.join(', ')}})}`;
                } else if (parentNode?.type === 'element') {
                    return `{${expression}}`;
                } else if (
                    (parentNode?.type === 'dotConditional' ||
                        parentNode?.type === 'dotInterpolated' ||
                        parentNode?.type === 'dotIterator') &&
                    ((parentNodeChildren.length === 1 && parentNodeChildren.includes(node)) ||
                        (parentNodeAlternate.length === 1 && parentNodeAlternate.includes(node)))
                ) {
                    // Nested conditional don't need wrapping
                    return expression;
                } else if (parentNodeChildren.length === 1) {
                    // In case of single child, we provide a cleaner output
                    return `{${expression}}`;
                }

                return `<>{${expression}}</>`;
            } else if (node.type === 'dotIterator') {
                const children = node.children
                    .filter((child) => child.type !== 'text' || child.value.trim() !== '')
                    .map((child) => traverse(child, node))
                    .join('');

                const expression = `${node.iteratedVariableName}?.map((${node.currentIterationVariableName}${
                    node.currentIterationIndexVariableName ? `, ${node.currentIterationIndexVariableName}` : ''
                }) => (${children}))`;

                if (parentNode?.type === 'element' && parentNode.attributes.includes(node)) {
                    throw new Error('Dot iterator in attributes is not supported.');
                } else if (parentNode?.type === 'element') {
                    return `{${expression}}`;
                } else if (parentNode?.type === 'root' && parentNodeChildren.length === 1) {
                    // At root level, if only child, we need to wrap with Fragment
                    return `<>{${expression}}</>`;
                } else if (parentNodeChildren.length === 1) {
                    // In case of single child, we provide a cleaner output
                    return `{${expression}}`;
                }

                return `<>{${expression}}</>`;
            } else if (node.type === 'comment') {
                // TODO: add support for comments?
                return '';
            } else if (node.type === 'dotEvaluated') {
                const indexOfNode = parentNodeChildren.indexOf(node);

                // If the evaluated block are the first children, we need to append it before the function definition
                if (
                    parentNode?.type === 'root' &&
                    indexOfNode !== -1 &&
                    parentNodeChildren[indexOfNode] === node &&
                    (indexOfNode === 0 || (indexOfNode - 1 >= 0 && parentNodeChildren[indexOfNode - 1].type === 'dotEvaluated'))
                ) {
                    beforeFunctionReturn.push(node.value);
                    return '';
                }

                throw new Error('Evaluated content within tag not yet supported');
            }

            throw new Error('Unsupported node type');
        }

        const result = traverse(ast);

        const getImports = () => `${[...imports].join('\n')}${imports.size > 0 ? '\n\n' : ''}`;
        const getBeforeFunctionReturn = () => `${beforeFunctionReturn.join('\n')}${beforeFunctionReturn.length > 0 ? '\n\n' : ''}`;

        return `${getImports()}export default function tpl(it: any) {\n    ${getBeforeFunctionReturn()}return ${result};\n}`;
    }

    private static childrenToStyle(styleNode: Attribute): string {
        const getValue = (node: Attribute['children'][0], parentNode?: Attribute['children'][0]): string => {
            if (node.type === 'text') {
                if (node.value.split(';').length === 1 && node.value.endsWith(';')) {
                    return `${node.value.slice(0, -1)}\`,`;
                }

                const [beforeColons, ...rest] = node.value.split(':');

                const hasPartialValueBefore = beforeColons?.split(';').length > 1;

                const attributeName = !hasPartialValueBefore ? beforeColons : beforeColons?.split(';').slice(1).join('');

                const prefixOutOfAttributeName = hasPartialValueBefore ? beforeColons?.split(';')[0].trim() ?? '' : undefined;

                const value = rest?.join(':').split(';')[0].trim() ?? '';
                const restOutOfValue = rest?.join(':').split(';').slice(1);

                const cleanAttributeName = attributeName
                    ?.trim()
                    .replace(/^-ms-/, 'ms-')
                    .replaceAll(/-./g, (minusAndLetter) => minusAndLetter[1].toUpperCase());

                const restAsTextNode: Text = {
                    type: 'text',
                    value: restOutOfValue ? restOutOfValue.filter(Boolean).join(':') : '',
                };

                // console.log(
                //     'prefixOutOfAttributeName',
                //     prefixOutOfAttributeName,
                //     'attributeName',
                //     attributeName,
                //     'value',
                //     value,
                //     'restOutOfValue',
                //     restOutOfValue?.filter(Boolean).join(':')
                // );

                const restAsTransformedString = restAsTextNode.value?.trim() !== '' ? getValue(restAsTextNode) : '';

                if (cleanAttributeName && value?.trim() !== '') {
                    return `${
                        prefixOutOfAttributeName ? `${prefixOutOfAttributeName}\`, ` : ''
                    }"${cleanAttributeName}": "${value?.trim()}", ${restAsTransformedString}`;
                } else if (cleanAttributeName && value?.trim() === '' && rest.length > 0) {
                    return `"${cleanAttributeName}": \``;
                } else if (cleanAttributeName && value?.trim() === '' && rest.length === 0) {
                    return cleanAttributeName;
                } else if (node.value.trim().endsWith(';') && node.value.trim() !== ';') {
                    return `${node.value.trim().slice(0, -1)}\`,`;
                } else if (node.value.trim().endsWith(';') && node.value.trim() === ';' && !node.value.includes(':')) {
                    return `${node.value.trim().slice(0, -1)}\`,`;
                } else if (node.value.trim() === '' || node.value.trim() === ';') {
                    return ' ';
                }

                throw new Error(`Invalid style attribute: ${JSON.stringify(node)}`);
            } else if (node.type === 'dotConditional') {
                const childrenNodesAsString = node.children.map((child) => getValue(child, node)).join('');
                const alternateNodesAsString = node.alternate ? `${node.alternate.map((child) => getValue(child, node)).join('')}` : '';

                if (!parentNode) {
                    const currentNodeIndexInParent = styleNode.children.indexOf(node);
                    if (currentNodeIndexInParent === -1) {
                        throw new Error('Could not find dot conditional in parent.');
                    }

                    const previousNode = currentNodeIndexInParent > 0 ? styleNode.children[currentNodeIndexInParent - 1] : null;

                    const previousNodeComputedValue = previousNode ? getValue(previousNode) : null;
                    if (previousNodeComputedValue && previousNodeComputedValue.endsWith(': `')) {
                        return `\${${node.test} ? \`${childrenNodesAsString}\` : ${
                            alternateNodesAsString ? `\`${alternateNodesAsString}\`` : 'undefined'
                        }}`;
                    }

                    const childrenNodesAreDotConditional = node.children.every((child) => child.type === 'dotConditional');

                    const alternateNodesAreDotConditional = node.alternate?.every((child) => child.type === 'dotConditional');

                    const childrenNodeExpression = childrenNodesAreDotConditional ? childrenNodesAsString : `{ ${childrenNodesAsString} }`;

                    const alternateNodeExpression = alternateNodesAreDotConditional
                        ? alternateNodesAsString
                        : `{ ${alternateNodesAsString} }`;

                    return `...(${node.test} ? ${childrenNodeExpression} : ${alternateNodeExpression}),`;
                } else if (parentNode.type === 'dotConditional') {
                    if (
                        node.type === 'dotConditional' &&
                        node.children.every((child) => child.type === 'text' && !child.value.includes('{') && child.value.includes(':'))
                    ) {
                        return `(${node.test} ? {${childrenNodesAsString}} : ${
                            alternateNodesAsString ? `{${alternateNodesAsString}}` : 'undefined'
                        })`;
                    }

                    return `\${${node.test} ? \`${childrenNodesAsString}\` : ${
                        alternateNodesAsString ? `\`${alternateNodesAsString}\`` : 'undefined'
                    }}`;
                }

                return `...(${node.test} ? { ${childrenNodesAsString} } : {${alternateNodesAsString}}),`;
            } else if (node.type === 'dotInterpolated' || node.type === 'dotEncoded' || node.type === 'dotEvaluated') {
                if (styleNode.children.at(-1) === node) {
                    return `\${${node.value}}\`,`;
                }

                return `\${${node.value}}`;
            }

            throw new Error('Unsupported node type in style.');
        };

        const outputStyleString = styleNode.children
            .map((child) => getValue(child, undefined))
            .join('')
            .replaceAll('}),`,', '})');

        if (outputStyleString.trim() === '') {
            throw new Error('Style cannot be empty');
        }

        return `{ ${outputStyleString} }`;
    }
}
