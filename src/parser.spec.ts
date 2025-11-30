/* (c) Copyright Frontify Ltd., all rights reserved. */

/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: on purpose */

import { describe, expect, it } from "vitest";

import { DotJsAst } from "./parser";

describe("DotJsAstParser", () => {
	describe("parse", () => {
		it("should parse an empty template", () => {
			expect(DotJsAst.parse("")).toEqual({
				type: "root",
				children: [],
			});
		});

		it("should parse a template with tags", () => {
			const template = "<div></div><span>My text</span><img/><link /><embed/><h1></h1>";

			expect(DotJsAst.parse(template)).toEqual({
				type: "root",
				children: [
					{
						type: "element",
						tagName: "div",
						attributes: [],
						children: [],
					},
					{
						type: "element",
						tagName: "span",
						attributes: [],
						children: [
							{
								type: "text",
								value: "My text",
							},
						],
					},
					{
						type: "element",
						tagName: "img",
						attributes: [],
						children: [],
					},
					{
						type: "element",
						tagName: "link",
						attributes: [],
						children: [],
					},
					{
						type: "element",
						tagName: "embed",
						attributes: [],
						children: [],
					},
					{
						type: "element",
						tagName: "h1",
						attributes: [],
						children: [],
					},
				],
			});
		});

		it("should parse a template with attributes", () => {
			const template =
				'<div class=" foo bar class_name class-name tw-flex tw-h-[41px]" for="myId"><div><span data-test-id="a-span"></span></div></div>';

			expect(DotJsAst.parse(template)).toEqual({
				type: "root",
				children: [
					{
						type: "element",
						tagName: "div",
						attributes: [
							{
								type: "attribute",
								name: "class",
								children: [
									{
										type: "text",
										value: " foo bar class_name class-name tw-flex tw-h-[41px]",
									},
								],
							},
							{
								type: "attribute",
								name: "for",
								children: [{ type: "text", value: "myId" }],
							},
						],
						children: [
							{
								type: "element",
								tagName: "div",
								attributes: [],
								children: [
									{
										type: "element",
										tagName: "span",
										attributes: [
											{
												type: "attribute",
												name: "data-test-id",
												children: [{ type: "text", value: "a-span" }],
											},
										],
										children: [],
									},
								],
							},
						],
					},
				],
			});
		});

		it("should parse a template with dot interpolated, dot encoded and dot evaluated", () => {
			const template = "<div>{{=     it.name}} {{it.city}}  \t  {{!it.address}}{{it['country']  }}</div>";

			expect(DotJsAst.parse(template)).toEqual({
				type: "root",
				children: [
					{
						type: "element",
						tagName: "div",
						attributes: [],
						children: [
							{
								type: "dotInterpolated",
								value: "it.name",
							},
							{
								type: "text",
								value: " ",
							},
							{
								type: "dotEvaluated",
								value: "it.city",
							},
							{
								type: "text",
								value: "    ",
							},
							{
								type: "dotEncoded",
								value: "it.address",
							},
							{
								type: "dotEvaluated",
								value: "it['country']",
							},
						],
					},
				],
			});
		});

		it("should parse a template with dot iterated", () => {
			const template = "<div>{{~it.array :value:index}}{{=value}}{{~}}</div>";

			expect(DotJsAst.parse(template)).toEqual({
				type: "root",
				children: [
					{
						type: "element",
						tagName: "div",
						attributes: [],
						children: [
							{
								type: "dotIterator",
								iteratedVariableName: "it.array",
								currentIterationVariableName: "value",
								currentIterationIndexVariableName: "index",
								children: [
									{
										type: "dotInterpolated",
										value: "value",
									},
								],
							},
						],
					},
				],
			});
		});

		it("should parse a template with dot condition (if)", () => {
			const template = "<div>{{? it.name}} {{=it.name}} {{?}}</div>";

			expect(DotJsAst.parse(template)).toEqual({
				type: "root",
				children: [
					{
						type: "element",
						tagName: "div",
						attributes: [],
						children: [
							{
								type: "dotConditional",
								test: "it.name",
								children: [
									{
										type: "text",
										value: " ",
									},
									{
										type: "dotInterpolated",
										value: "it.name",
									},
									{
										type: "text",
										value: " ",
									},
								],
							},
						],
					},
				],
			});
		});

		it("should parse a template with dot condition (if/else)", () => {
			const template = "<div>{{? it.name}}{{=it.name}}{{??}} {{=it.city}} {{?}}</div>";

			expect(DotJsAst.parse(template)).toEqual({
				type: "root",
				children: [
					{
						type: "element",
						tagName: "div",
						attributes: [],
						children: [
							{
								type: "dotConditional",
								test: "it.name",
								children: [
									{
										type: "dotInterpolated",
										value: "it.name",
									},
								],
								alternate: [
									{
										type: "text",
										value: " ",
									},
									{
										type: "dotInterpolated",
										value: "it.city",
									},
									{
										type: "text",
										value: " ",
									},
								],
							},
						],
					},
				],
			});
		});

		it("should parse a template with dot condition (if/elseif)", () => {
			const template = "<div>{{? it.name}}{{=it.name}}{{?? it.city}}{{=it.city}}{{?}}</div>";

			expect(DotJsAst.parse(template)).toEqual({
				type: "root",
				children: [
					{
						type: "element",
						tagName: "div",
						attributes: [],
						children: [
							{
								type: "dotConditional",
								test: "it.name",
								children: [
									{
										type: "dotInterpolated",
										value: "it.name",
									},
								],
								alternate: [
									{
										type: "dotConditional",
										test: "it.city",
										children: [
											{
												type: "dotInterpolated",
												value: "it.city",
											},
										],
									},
								],
							},
						],
					},
				],
			});
		});

		it("should parse a template with dot condition (if/elseif/else)", () => {
			const template = "<div>{{? it.name}}{{=it.name}}{{?? it.city}}{{=it.city}}{{??}}{{=it.country}}{{?}}</div>";

			expect(DotJsAst.parse(template)).toEqual({
				type: "root",
				children: [
					{
						type: "element",
						tagName: "div",
						attributes: [],
						children: [
							{
								type: "dotConditional",
								test: "it.name",
								children: [
									{
										type: "dotInterpolated",
										value: "it.name",
									},
								],
								alternate: [
									{
										type: "dotConditional",
										test: "it.city",
										children: [
											{
												type: "dotInterpolated",
												value: "it.city",
											},
										],
										alternate: [
											{
												type: "dotInterpolated",
												value: "it.country",
											},
										],
									},
								],
							},
						],
					},
				],
			});
		});

		it("should parse a template with dot condition (if/elseif/else) with multiple nested children", () => {
			const template =
				"<div>{{? it.name}}<span>{{=it.name}}</span>{{?? it.city1And2}}<span>{{=it.city1}}</span><span>{{=it.city2}}</span>{{??}}<span>{{=it.country}}</span>{{?}}</div>";

			expect(DotJsAst.parse(template)).toEqual({
				type: "root",
				children: [
					{
						type: "element",
						tagName: "div",
						attributes: [],
						children: [
							{
								type: "dotConditional",
								test: "it.name",
								children: [
									{
										type: "element",
										tagName: "span",
										attributes: [],
										children: [
											{
												type: "dotInterpolated",
												value: "it.name",
											},
										],
									},
								],
								alternate: [
									{
										type: "dotConditional",
										test: "it.city1And2",
										children: [
											{
												type: "element",
												tagName: "span",
												attributes: [],
												children: [
													{
														type: "dotInterpolated",
														value: "it.city1",
													},
												],
											},
											{
												type: "element",
												tagName: "span",
												attributes: [],
												children: [
													{
														type: "dotInterpolated",
														value: "it.city2",
													},
												],
											},
										],
										alternate: [
											{
												type: "element",
												tagName: "span",
												attributes: [],
												children: [
													{
														type: "dotInterpolated",
														value: "it.country",
													},
												],
											},
										],
									},
								],
							},
						],
					},
				],
			});
		});

		it("should parse a template with normal attributes", () => {
			const template = '<div test data-value="value" data-test-id="foo" controls>Text</div>';

			expect(DotJsAst.parse(template)).toEqual({
				type: "root",
				children: [
					{
						type: "element",
						tagName: "div",
						attributes: [
							{
								type: "attribute",
								name: "test",
								children: [],
							},
							{
								type: "attribute",
								name: "data-value",
								children: [{ type: "text", value: "value" }],
							},
							{
								type: "attribute",
								name: "data-test-id",
								children: [{ type: "text", value: "foo" }],
							},
							{
								type: "attribute",
								name: "controls",
								children: [],
							},
						],
						children: [{ type: "text", value: "Text" }],
					},
				],
			});
		});

		it("should parse a template with dot iterated surrounding the attributes", () => {
			const template = '<div {{~it.array :value:index}}data-item="{{=value}}{{=index}}"{{~}}>Text</div>';

			expect(DotJsAst.parse(template)).toEqual({
				type: "root",
				children: [
					{
						type: "element",
						tagName: "div",
						attributes: [
							{
								type: "dotIterator",
								iteratedVariableName: "it.array",
								currentIterationVariableName: "value",
								currentIterationIndexVariableName: "index",
								children: [
									{
										type: "attribute",
										name: "data-item",
										children: [
											{
												type: "dotInterpolated",
												value: "value",
											},
											{
												type: "dotInterpolated",
												value: "index",
											},
										],
									},
								],
							},
						],
						children: [{ type: "text", value: "Text" }],
					},
				],
			});
		});

		it("should parse a template with dot conditional (if) in the attributes", () => {
			const template = '<div data-answer="{{? it.areYouSure}}yes{{?}}">Text</div>';

			expect(DotJsAst.parse(template)).toEqual({
				type: "root",
				children: [
					{
						type: "element",
						tagName: "div",
						attributes: [
							{
								type: "attribute",
								name: "data-answer",
								children: [
									{
										type: "dotConditional",
										test: "it.areYouSure",
										children: [
											{
												type: "text",
												value: "yes",
											},
										],
									},
								],
							},
						],
						children: [{ type: "text", value: "Text" }],
					},
				],
			});
		});

		it("should parse a template with dot conditional (if/else) in the attributes", () => {
			const template = '<div data-answer="{{? it.areYouSure}}yes{{??}}nah{{?}}">Text</div>';

			expect(DotJsAst.parse(template)).toEqual({
				type: "root",
				children: [
					{
						type: "element",
						tagName: "div",
						children: [{ type: "text", value: "Text" }],
						attributes: [
							{
								type: "attribute",
								name: "data-answer",
								children: [
									{
										type: "dotConditional",
										test: "it.areYouSure",
										children: [
											{
												type: "text",
												value: "yes",
											},
										],
										alternate: [
											{
												type: "text",
												value: "nah",
											},
										],
									},
								],
							},
						],
					},
				],
			});
		});

		it("should parse a template with dot conditional (if/elseif) in the attributes", () => {
			const template = '<div data-answer="{{? it.areYouSure}}yes{{?? it.areYouExtremelySure}}YES{{?}}">Text</div>';

			expect(DotJsAst.parse(template)).toEqual({
				type: "root",
				children: [
					{
						type: "element",
						tagName: "div",
						children: [{ type: "text", value: "Text" }],
						attributes: [
							{
								type: "attribute",
								name: "data-answer",
								children: [
									{
										type: "dotConditional",
										test: "it.areYouSure",
										children: [
											{
												type: "text",
												value: "yes",
											},
										],
										alternate: [
											{
												type: "dotConditional",
												test: "it.areYouExtremelySure",
												children: [
													{
														type: "text",
														value: "YES",
													},
												],
											},
										],
									},
								],
							},
						],
					},
				],
			});
		});

		it("should parse a template with dot conditional (if/elseif/else) in the attributes", () => {
			const template = '<div data-answer="{{? it.areYouSure}}yes{{?? it.areYouExtremelySure}}YES{{??}}nah{{?}}">Text</div>';

			expect(DotJsAst.parse(template)).toEqual({
				type: "root",
				children: [
					{
						type: "element",
						tagName: "div",
						children: [{ type: "text", value: "Text" }],
						attributes: [
							{
								type: "attribute",
								name: "data-answer",
								children: [
									{
										type: "dotConditional",
										test: "it.areYouSure",
										children: [
											{
												type: "text",
												value: "yes",
											},
										],
										alternate: [
											{
												type: "dotConditional",
												test: "it.areYouExtremelySure",
												children: [
													{
														type: "text",
														value: "YES",
													},
												],
												alternate: [
													{
														type: "text",
														value: "nah",
													},
												],
											},
										],
									},
								],
							},
						],
					},
				],
			});
		});

		it("should parse a template with dot conditional (if) surrounding the attributes", () => {
			const template = '<div {{? it.areYouSure}}data-answer="yes"{{?}}>Text</div>';

			expect(DotJsAst.parse(template)).toEqual({
				type: "root",
				children: [
					{
						type: "element",
						tagName: "div",
						attributes: [
							{
								type: "dotConditional",
								test: "it.areYouSure",
								children: [
									{
										type: "attribute",
										name: "data-answer",
										children: [
											{
												type: "text",
												value: "yes",
											},
										],
									},
								],
							},
						],
						children: [{ type: "text", value: "Text" }],
					},
				],
			});
		});

		it("should parse a template with dot conditional (if/else) surrounding the attributes", () => {
			const template = '<div {{? it.areYouSure}}data-answer="yes"{{??}}data-answer="nah"{{?}}>Text</div>';

			expect(DotJsAst.parse(template)).toEqual({
				type: "root",
				children: [
					{
						type: "element",
						tagName: "div",
						children: [{ type: "text", value: "Text" }],
						attributes: [
							{
								type: "dotConditional",
								test: "it.areYouSure",
								children: [
									{
										type: "attribute",
										name: "data-answer",
										children: [
											{
												type: "text",
												value: "yes",
											},
										],
									},
								],
								alternate: [
									{
										type: "attribute",
										name: "data-answer",
										children: [
											{
												type: "text",
												value: "nah",
											},
										],
									},
								],
							},
						],
					},
				],
			});
		});

		it("should parse a template with dot conditional (if/elseif) surrounding the attributes", () => {
			const template = '<div {{? it.areYouSure}}data-answer="yes"{{?? it.areYouExtremelySure}}data-answer="YES"{{?}}>Text</div>';

			expect(DotJsAst.parse(template)).toEqual({
				type: "root",
				children: [
					{
						type: "element",
						tagName: "div",
						children: [{ type: "text", value: "Text" }],
						attributes: [
							{
								type: "dotConditional",
								test: "it.areYouSure",
								children: [
									{
										type: "attribute",
										name: "data-answer",
										children: [
											{
												type: "text",
												value: "yes",
											},
										],
									},
								],
								alternate: [
									{
										type: "dotConditional",
										test: "it.areYouExtremelySure",
										children: [
											{
												type: "attribute",
												name: "data-answer",
												children: [
													{
														type: "text",
														value: "YES",
													},
												],
											},
										],
									},
								],
							},
						],
					},
				],
			});
		});

		it("should parse a template with dot conditional (if/elseif/else) surrounding the attributes", () => {
			const template =
				'<div {{? it.areYouSure}}data-answer="yes"{{?? it.areYouExtremelySure}}data-answer="YES"{{??}}data-answer="nah"{{?}}>Text</div>';

			expect(DotJsAst.parse(template)).toEqual({
				type: "root",
				children: [
					{
						type: "element",
						tagName: "div",
						children: [{ type: "text", value: "Text" }],
						attributes: [
							{
								type: "dotConditional",
								test: "it.areYouSure",
								children: [
									{
										type: "attribute",
										name: "data-answer",
										children: [
											{
												type: "text",
												value: "yes",
											},
										],
									},
								],
								alternate: [
									{
										type: "dotConditional",
										test: "it.areYouExtremelySure",
										children: [
											{
												type: "attribute",
												name: "data-answer",
												children: [
													{
														type: "text",
														value: "YES",
													},
												],
											},
										],
										alternate: [
											{
												type: "attribute",
												name: "data-answer",
												children: [
													{
														type: "text",
														value: "nah",
													},
												],
											},
										],
									},
								],
							},
						],
					},
				],
			});
		});
	});

	describe("toJsxString", () => {
		it("should convert empty tag", () => {
			expect(DotJsAst.toJsxString("<div></div>")).toBe("export default function tpl(it: any) {\n    return <div></div>;\n}");
		});

		it("should convert tag with one child", () => {
			expect(
				DotJsAst.toJsxString(`
                    <div>
                        <span>Content</span>
                    </div>
                `),
			).toBe("export default function tpl(it: any) {\n    return <div><span>Content</span></div>;\n}");
		});

		it("should convert tag with multiple children", () => {
			expect(
				DotJsAst.toJsxString(`
                    <div>
                        <span>Content1</span>
                        <span>Content2</span>
                    </div>
                `),
			).toBe("export default function tpl(it: any) {\n    return <div><span>Content1</span><span>Content2</span></div>;\n}");
		});

		it("should convert multiple empty tags at root and add fragment", () => {
			expect(DotJsAst.toJsxString("<div></div><span></span>")).toBe(
				"export default function tpl(it: any) {\n    return <><div></div><span></span></>;\n}",
			);
		});

		it("should convert multiple tags at root with one child", () => {
			expect(
				DotJsAst.toJsxString(`
                    <div>
                        <span>Content1</span>
                    </div>
                    <div>
                        <span>Content2</span>
                    </div>
                `),
			).toBe(
				"export default function tpl(it: any) {\n    return <><div><span>Content1</span></div><div><span>Content2</span></div></>;\n}",
			);
		});

		it("should convert multiple tags at root with multiple children", () => {
			expect(
				DotJsAst.toJsxString(`
                    <div>
                        <span>Content1</span>
                        <span>Content2</span>
                    </div>
                    <div>
                        <span>Content3</span>
                        <span>Content4</span>
                    </div>
                `),
			).toBe(
				"export default function tpl(it: any) {\n    return <><div><span>Content1</span><span>Content2</span></div><div><span>Content3</span><span>Content4</span></div></>;\n}",
			);
		});

		it("should convert one encoding", () => {
			expect(DotJsAst.toJsxString("<span>{{! it.content }}</span>")).toBe(
				"export default function tpl(it: any) {\n    return <span>{it.content}</span>;\n}",
			);
		});

		it("should convert one encoding with nested object", () => {
			expect(DotJsAst.toJsxString("<span>{{! it.foo.bar.content }}</span>")).toBe(
				"export default function tpl(it: any) {\n    return <span>{it.foo.bar.content}</span>;\n}",
			);
		});

		it("should convert multiple encoding", () => {
			expect(DotJsAst.toJsxString("<span>{{! it.content1 }}{{! it.content2 }}</span>")).toBe(
				"export default function tpl(it: any) {\n    return <span>{it.content1}{it.content2}</span>;\n}",
			);
		});

		it("should convert multiple encoding with nested objects", () => {
			expect(DotJsAst.toJsxString("<span>{{! it.foo.bar.content1 }}{{! it.bar.foo.content2 }}</span>")).toBe(
				"export default function tpl(it: any) {\n    return <span>{it.foo.bar.content1}{it.bar.foo.content2}</span>;\n}",
			);
		});

		it("should convert one interpolation", () => {
			expect(DotJsAst.toJsxString("<span>{{= it.content }}</span>")).toBe(
				'import parseHtml from "html-react-parser";\n\nexport default function tpl(it: any) {\n    return <span>{parseHtml(it.content)}</span>;\n}',
			);
		});

		it("should convert multiple interpolation", () => {
			expect(DotJsAst.toJsxString("<span>{{= it.content1 }}{{= it.content2 }}</span>")).toBe(
				'import parseHtml from "html-react-parser";\n\nexport default function tpl(it: any) {\n    return <span>{parseHtml(it.content1)}{parseHtml(it.content2)}</span>;\n}',
			);
		});

		it("should convert simple if with single condition at root", () => {
			expect(
				DotJsAst.toJsxString(`
                    {{? it.showContent }}
                    <span>{{= it.content }}</span>
                    {{?}}
                `),
			).toBe(
				'import parseHtml from "html-react-parser";\n\nexport default function tpl(it: any) {\n    return it.showContent ? <span>{parseHtml(it.content)}</span> : null;\n}',
			);
		});

		it("should convert simple if with single condition as a child", () => {
			expect(
				DotJsAst.toJsxString(`
                    <div>
                        {{? it.showContent }}
                        <span>{{= it.content }}</span>
                        {{?}}
                    </div>
                `),
			).toBe(
				'import parseHtml from "html-react-parser";\n\nexport default function tpl(it: any) {\n    return <div>{it.showContent ? <span>{parseHtml(it.content)}</span> : null}</div>;\n}',
			);
		});

		it("should convert simple if with double condition at root", () => {
			expect(
				DotJsAst.toJsxString(`
                    {{? it.showContent && it.showContent2 }}
                    <span>{{! it.content }}</span>
                    {{?}}
                `),
			).toBe(
				"export default function tpl(it: any) {\n    return it.showContent && it.showContent2 ? <span>{it.content}</span> : null;\n}",
			);
		});

		it("should convert simple if with double condition as a child", () => {
			expect(
				DotJsAst.toJsxString(`
                    <div>
                    {{? it.showContent && it.showContent2 }}
                    <span>{{! it.content }}</span>
                    {{?}}
                    </div>
                `),
			).toBe(
				"export default function tpl(it: any) {\n    return <div>{it.showContent && it.showContent2 ? <span>{it.content}</span> : null}</div>;\n}",
			);
		});

		it("should convert if/else with simple condition at root", () => {
			expect(
				DotJsAst.toJsxString(`
                    {{? it.showContent }}
                    <span>{{! it.content }}</span>
                    {{??}}
                    <span>{{! it.noContent }}</span>
                    {{?}}
                `),
			).toBe(
				"export default function tpl(it: any) {\n    return it.showContent ? <span>{it.content}</span> : <span>{it.noContent}</span>;\n}",
			);
		});

		it("should convert if/else with simple condition as a child", () => {
			expect(
				DotJsAst.toJsxString(`
                    <div>
                    {{? it.showContent }}
                    <span>{{! it.content }}</span>
                    {{??}}
                    <span>{{! it.noContent }}</span>
                    {{?}}
                    </div>
                `),
			).toBe(
				"export default function tpl(it: any) {\n    return <div>{it.showContent ? <span>{it.content}</span> : <span>{it.noContent}</span>}</div>;\n}",
			);
		});

		it("should convert nested if/else with simple condition at root", () => {
			expect(
				DotJsAst.toJsxString(`
                    {{? it.showContent }}
                    <span>{{? it.areYourSure}}<span>hello</span>{{?}}</span>
                    {{??}}
                    <span>{{! it.noContent }}</span>
                    {{?}}
                `),
			).toBe(
				"export default function tpl(it: any) {\n    return it.showContent ? <span>{it.areYourSure ? <span>hello</span> : null}</span> : <span>{it.noContent}</span>;\n}",
			);
		});

		it("should convert nested if/else with simple condition as a child", () => {
			expect(
				DotJsAst.toJsxString(`
                    <div>
                    {{? it.showContent }}
                    <span>{{? it.areYourSure}}<span>hello</span>{{?}}</span>
                    {{??}}
                    <span>{{! it.noContent }}</span>
                    {{?}}
                    </div>
                `),
			).toBe(
				"export default function tpl(it: any) {\n    return <div>{it.showContent ? <span>{it.areYourSure ? <span>hello</span> : null}</span> : <span>{it.noContent}</span>}</div>;\n}",
			);
		});

		it("should convert nested if/else with simple condition as a child of a loop", () => {
			expect(
				DotJsAst.toJsxString(`
                    <div>
                    {{~ it.items :item }}
                        {{? item.showContent }}
                        <span>{{? item.areYourSure}}<span>hello</span>{{?}}</span>
                        {{??}}
                        <span>{{! item.noContent }}</span>
                        {{?}}
                    {{~}}
                    </div>
                `),
			).toBe(
				"export default function tpl(it: any) {\n    return <div>{it.items?.map((item) => (item.showContent ? <span>{item.areYourSure ? <span>hello</span> : null}</span> : <span>{item.noContent}</span>))}</div>;\n}",
			);
		});

		it("should convert if/else with double condition at root", () => {
			expect(
				DotJsAst.toJsxString(`
                    {{? it.showContent && it.areYouSure }}
                    <span>{{! it.content }}</span>
                    {{??}}
                    <span>{{! it.noContent }}</span>
                    {{?}}
                `),
			).toBe(
				"export default function tpl(it: any) {\n    return it.showContent && it.areYouSure ? <span>{it.content}</span> : <span>{it.noContent}</span>;\n}",
			);
		});

		it("should convert if/else with double condition as a child", () => {
			expect(
				DotJsAst.toJsxString(`
                    <div>
                    {{? it.showContent && it.areYouSure }}
                    <span>{{! it.content }}</span>
                    {{??}}
                    <span>{{! it.noContent }}</span>
                    {{?}}
                    </div>
                `),
			).toBe(
				"export default function tpl(it: any) {\n    return <div>{it.showContent && it.areYouSure ? <span>{it.content}</span> : <span>{it.noContent}</span>}</div>;\n}",
			);
		});

		it("should convert if/elseif with simple condition at root", () => {
			expect(
				DotJsAst.toJsxString(`
                    {{? it.showContent }}
                    <span>{{! it.content }}</span>
                    {{?? it.showContent2}}
                    <span>{{! it.content2 }}</span>
                    {{?}}
                `),
			).toBe(
				"export default function tpl(it: any) {\n    return it.showContent ? <span>{it.content}</span> : it.showContent2 ? <span>{it.content2}</span> : null;\n}",
			);
		});

		it("should convert if/elseif with simple condition as a child", () => {
			expect(
				DotJsAst.toJsxString(`
                    <div>
                    {{? it.showContent }}
                    <span>{{! it.content }}</span>
                    {{?? it.showContent2}}
                    <span>{{! it.content2 }}</span>
                    {{?}}
                    </div>
                `),
			).toBe(
				"export default function tpl(it: any) {\n    return <div>{it.showContent ? <span>{it.content}</span> : it.showContent2 ? <span>{it.content2}</span> : null}</div>;\n}",
			);
		});

		it("should convert if/elseif with double condition at root", () => {
			expect(
				DotJsAst.toJsxString(`
                    {{? it.showContent }}
                    <span>{{! it.content }}</span>
                    {{?? it.showContent2 && it.areYouSure}}
                    <span>{{! it.content2 }}</span>
                    {{?}}
                `),
			).toBe(
				"export default function tpl(it: any) {\n    return it.showContent ? <span>{it.content}</span> : it.showContent2 && it.areYouSure ? <span>{it.content2}</span> : null;\n}",
			);
		});

		it("should convert if/elseif with double condition as a child", () => {
			expect(
				DotJsAst.toJsxString(`
                    <div>
                    {{? it.showContent }}
                    <span>{{! it.content }}</span>
                    {{?? it.showContent2 && it.areYouSure}}
                    <span>{{! it.content2 }}</span>
                    {{?}}
                    </div>
                `),
			).toBe(
				"export default function tpl(it: any) {\n    return <div>{it.showContent ? <span>{it.content}</span> : it.showContent2 && it.areYouSure ? <span>{it.content2}</span> : null}</div>;\n}",
			);
		});

		it("should convert if/elseif/else with simple condition at root", () => {
			expect(
				DotJsAst.toJsxString(`
                    {{? it.showContent1 }}
                    <span>{{! it.content1 }}</span>
                    {{?? it.showContent2 }}
                    <span>{{! it.content2 }}</span>
                    {{??}}
                    <span>{{! it.noContent }}</span>
                    {{?}}
                `),
			).toBe(
				"export default function tpl(it: any) {\n    return it.showContent1 ? <span>{it.content1}</span> : it.showContent2 ? <span>{it.content2}</span> : <span>{it.noContent}</span>;\n}",
			);
		});

		it("should convert if/elseif/else with simple condition as a child", () => {
			expect(
				DotJsAst.toJsxString(`
                    <div>
                    {{? it.showContent1 }}
                    <span>{{! it.content1 }}</span>
                    {{?? it.showContent2 }}
                    <span>{{! it.content2 }}</span>
                    {{??}}
                    <span>{{! it.noContent }}</span>
                    {{?}}
                    </div>
                `),
			).toBe(
				"export default function tpl(it: any) {\n    return <div>{it.showContent1 ? <span>{it.content1}</span> : it.showContent2 ? <span>{it.content2}</span> : <span>{it.noContent}</span>}</div>;\n}",
			);
		});

		it("should convert if/elseif/else with complex returns", () => {
			expect(
				DotJsAst.toJsxString(`
                    <div>
                    {{? it.showContent1 }}
                    <span>{{! it.content1Bis }}</span>
                        {{? it.showContent1Bis }}
                        <span>{{! it.showContent1Bis }}</span>
                        {{?}}
                    <span>{{! it.content1Bis }}</span>
                    {{?? it.showContent2 }}
                    <span>{{! it.content2 }}</span>
                    {{?? it.showContent3 }}
                    {{! it.content3 }}
                    {{?? it.showContent4 }}
                    {{= it.content4 }}
                    {{?? it.showContent5 }}
                    <span>Content 5</span>
                    <span>Content 5 bis</span>
                    {{??}}
                    <span>{{! it.noContent }}</span>
                    {{?}}
                    </div>
                `),
			).toBe(
				'import parseHtml from "html-react-parser";\n\nexport default function tpl(it: any) {\n    return <div>{it.showContent1 ? <><span>{it.content1Bis}</span><>{it.showContent1Bis ? <span>{it.showContent1Bis}</span> : null}</><span>{it.content1Bis}</span></> : it.showContent2 ? <span>{it.content2}</span> : it.showContent3 ? it.content3 : it.showContent4 ? parseHtml(it.content4) : it.showContent5 ? <><span>Content 5</span><span>Content 5 bis</span></> : <span>{it.noContent}</span>}</div>;\n}',
			);
		});

		it("should convert if/elseif/else with double condition at root", () => {
			expect(
				DotJsAst.toJsxString(`
                    {{? it.showContent && it.areYouSure }}
                    <span>{{! it.content1 }}</span>
                    {{?? it.showContent2 && it.areYouSure}}
                    <span>{{! it.content2 }}</span>
                    {{??}}
                    <span>{{! it.noContent }}</span>
                    {{?}}
                `),
			).toBe(
				"export default function tpl(it: any) {\n    return it.showContent && it.areYouSure ? <span>{it.content1}</span> : it.showContent2 && it.areYouSure ? <span>{it.content2}</span> : <span>{it.noContent}</span>;\n}",
			);
		});

		it("should convert if/elseif/else with double condition as a child", () => {
			expect(
				DotJsAst.toJsxString(`
                    <div>
                    {{? it.showContent && it.areYouSure }}
                    <span>{{! it.content1 }}</span>
                    {{?? it.showContent2 && it.areYouSure}}
                    <span>{{! it.content2 }}</span>
                    {{??}}
                    <span>{{! it.noContent }}</span>
                    {{?}}
                    </div>
                `),
			).toBe(
				"export default function tpl(it: any) {\n    return <div>{it.showContent && it.areYouSure ? <span>{it.content1}</span> : it.showContent2 && it.areYouSure ? <span>{it.content2}</span> : <span>{it.noContent}</span>}</div>;\n}",
			);
		});

		it("should convert loops at root", () => {
			expect(
				DotJsAst.toJsxString(`
                    {{~ items :item }}
                    <div>{{= item }}</div>
                    {{~}}
                `),
			).toBe(
				'import parseHtml from "html-react-parser";\n\nexport default function tpl(it: any) {\n    return <>{items?.map((item) => (<div>{parseHtml(item)}</div>))}</>;\n}',
			);
		});

		it("should convert loops as a child", () => {
			expect(
				DotJsAst.toJsxString(`
                    <ul>
                        {{~ items :item }}
                        <li>{{= item }}</li>
                        {{~}}
                    </ul>
                `),
			).toBe(
				'import parseHtml from "html-react-parser";\n\nexport default function tpl(it: any) {\n    return <ul>{items?.map((item) => (<li>{parseHtml(item)}</li>))}</ul>;\n}',
			);
		});

		it("should convert loops with index", () => {
			expect(
				DotJsAst.toJsxString(`
                    <ul>
                        {{~ it.items :item:index }}
                        <li>{{! item }}{{! index }}</li>
                        {{~}}
                    </ul>
                `),
			).toBe(
				"export default function tpl(it: any) {\n    return <ul>{it.items?.map((item, index) => (<li>{item}{index}</li>))}</ul>;\n}",
			);
		});

		it("should convert loops with dot interpolate inside", () => {
			expect(
				DotJsAst.toJsxString(`
                    <ul>
                        {{~ it.items :item:index }}
                        {{= it.tpl.render('foo', item) }}
                        {{~}}
                    </ul>
                `),
			).toBe(
				"import parseHtml from \"html-react-parser\";\n\nexport default function tpl(it: any) {\n    return <ul>{it.items?.map((item, index) => (parseHtml(it.tpl.render('foo', item))))}</ul>;\n}",
			);
		});

		it("should convert tag with `data-` attribute", () => {
			expect(DotJsAst.toJsxString('<div data-test-id="foo"></div>')).toBe(
				'export default function tpl(it: any) {\n    return <div data-test-id="foo"></div>;\n}',
			);
		});

		it("should convert tag containing attributes without values", () => {
			expect(DotJsAst.toJsxString('<video loop data-test-id="foo" controls></video>')).toBe(
				'export default function tpl(it: any) {\n    return <video loop data-test-id="foo" controls></video>;\n}',
			);
		});

		it("should convert tag with conditional `data-` attribute", () => {
			expect(DotJsAst.toJsxString('<div {{? it.enabled }}data-test-id="foo"{{?}}></div>')).toBe(
				'export default function tpl(it: any) {\n    return <div {...(it.enabled ? {"data-test-id": "foo"} : {})}></div>;\n}',
			);
		});

		it("should convert tag with conditional `data-` attribute and conditional value", () => {
			expect(DotJsAst.toJsxString('<div {{? it.enabled }}data-test-id="{{? it.first }}first{{??}}second{{?}}"{{?}}></div>')).toBe(
				'export default function tpl(it: any) {\n    return <div {...(it.enabled ? {"data-test-id": it.first ? "first" : "second"} : {})}></div>;\n}',
			);
		});

		it("should convert tag with multiple conditional `data-` attributes", () => {
			expect(DotJsAst.toJsxString('<div {{? it.enabled }}data-test-id-first="foo" data-test-id-second="bar"{{?}}></div>')).toBe(
				'export default function tpl(it: any) {\n    return <div {...(it.enabled ? {"data-test-id-first": "foo", "data-test-id-second": "bar"} : {})}></div>;\n}',
			);
		});

		it("should convert tag with conditional and variable `data-` attribute", () => {
			expect(DotJsAst.toJsxString('<div {{? it.enabled }}data-test-id="{{! it.dataTestId }}"{{?}}></div>')).toBe(
				'export default function tpl(it: any) {\n    return <div {...(it.enabled ? {"data-test-id": it.dataTestId} : {})}></div>;\n}',
			);
		});

		it("should convert tag with multiple conditional and variable `data-` attributes", () => {
			expect(
				DotJsAst.toJsxString(
					'<div {{? it.enabled }}data-test-id-first="{{! it.dataTestIdFirst }}" data-test-id-second="{{! it.dataTestIdSecond }}"{{?}}></div>',
				),
			).toBe(
				'export default function tpl(it: any) {\n    return <div {...(it.enabled ? {"data-test-id-first": it.dataTestIdFirst, "data-test-id-second": it.dataTestIdSecond} : {})}></div>;\n}',
			);
		});

		it("should not support iterable `data-` attribute", () => {
			expect(() => DotJsAst.toJsxString('<div {{~ it.items : item :index}}data-item-id="{{! item }}"{{~}}></div>')).toThrowError();
		});

		it("should not support dynamic tag name", () => {
			expect(() => DotJsAst.toJsxString("<{{? it.enabled }}abc{{?}}></{{? it.enabled }}abc{{?}}>")).toThrowError();
		});

		it("should convert tag with single encoded `data-` attribute", () => {
			expect(DotJsAst.toJsxString('<div data-abc="{{! it.foo }}"></div>')).toBe(
				"export default function tpl(it: any) {\n    return <div data-abc={it.foo}></div>;\n}",
			);
		});

		it("should convert tag with multiple encoded `data-` attribute", () => {
			expect(DotJsAst.toJsxString('<div data-abc="{{! it.foo1 }}{{! it.foo2 }}"></div>')).toBe(
				"export default function tpl(it: any) {\n    return <div data-abc={`${it.foo1}${it.foo2}`}></div>;\n}",
			);
		});

		it("should convert tag with `class` attribute", () => {
			expect(DotJsAst.toJsxString('<div class="foo"></div>')).toBe(
				'export default function tpl(it: any) {\n    return <div className="foo"></div>;\n}',
			);
		});

		it("should convert tag with variable `class` attribute", () => {
			expect(DotJsAst.toJsxString('<div class="custom1 custom-{{! it.type }} custom2 {{= it.class}}"></div>')).toBe(
				"export default function tpl(it: any) {\n    return <div className={`custom1 custom-${it.type} custom2 ${it.class}`}></div>;\n}",
			);
		});

		it("should convert tag with if conditional variable in `class` attribute", () => {
			expect(DotJsAst.toJsxString('<div class="custom1 {{? it.maybe}} hehehe {{?}}"></div>')).toBe(
				"export default function tpl(it: any) {\n    return <div className={`custom1 ${it.maybe ? ` hehehe ` : ``}`}></div>;\n}",
			);
		});

		it("should convert tag with if/else conditional variable in `class` attribute", () => {
			expect(DotJsAst.toJsxString('<div class="custom1 {{? it.maybe}} hehehe {{??}} hallo{{?}}"></div>')).toBe(
				"export default function tpl(it: any) {\n    return <div className={`custom1 ${it.maybe ? ` hehehe ` : ` hallo`}`}></div>;\n}",
			);
		});

		it("should convert tag with if/else conditional variable in `class` attribute", () => {
			expect(
				DotJsAst.toJsxString('<div class="custom1 {{? it.maybe}} hehehe {{?? it.forsure }} hallo {{??}}byebye{{?}}"></div>'),
			).toBe(
				"export default function tpl(it: any) {\n    return <div className={`custom1 ${it.maybe ? ` hehehe ` : `${it.forsure ? ` hallo ` : `byebye`}`}`}></div>;\n}",
			);
		});

		it("should convert tag with iterable variable in `class` attribute", () => {
			expect(DotJsAst.toJsxString('<div class="custom1 {{~ it.items:item}} test-{{!item}}{{~}}"></div>')).toBe(
				"export default function tpl(it: any) {\n    return <div className={`custom1 ${it.items?.map((item) => ` test-${item}`)}`}></div>;\n}",
			);
		});

		it("should convert tag with single `style` attribute", () => {
			expect(DotJsAst.toJsxString('<div style="color: red;"></div>')).toBe(
				'export default function tpl(it: any) {\n    return <div style={{"color":"red"}}></div>;\n}',
			);
		});

		it("should convert tag with single `style` attribute containing dot encoded and spaced", () => {
			expect(DotJsAst.toJsxString('<div style="padding: {{! it.top }} {{! it.right}} {{! it.bottom }} {{! it.right}};"></div>')).toBe(
				'export default function tpl(it: any) {\n    return <div style={{ "padding": `${it.top} ${it.right} ${it.bottom} ${it.right}`, }}></div>;\n}',
			);
		});

		it("should convert tag with `style` attribute with dot conditional value", () => {
			expect(DotJsAst.toJsxString('<div style="color: {{? it.enabled}}green{{??}}red{{?}};"></div>')).toBe(
				'export default function tpl(it: any) {\n    return <div style={{ "color": `${it.enabled ? `green` : `red`}`, }}></div>;\n}',
			);
		});

		it("should convert tag with `style` attribute surrounded by dot conditional", () => {
			expect(DotJsAst.toJsxString('<div {{? it.enabled}}style="color: red;"{{?}}></div>')).toBe(
				'export default function tpl(it: any) {\n    return <div {...(it.enabled ? { "style": {"color":"red"} } : {})}></div>;\n}',
			);
		});

		it("should convert tag with `style` attribute dot encoded value surrounded by dot conditional", () => {
			expect(DotJsAst.toJsxString('<div {{? it.enabled}}style="color: {{! it.color }};"{{?}} ></div>')).toBe(
				'export default function tpl(it: any) {\n    return <div {...(it.enabled ? { "style": { "color": `${it.color}`, } } : {})}></div>;\n}',
			);
		});

		it("should convert tag with `style` attribute with single dot encoded value surrounded by dot conditional without semicolon", () => {
			expect(DotJsAst.toJsxString('<div {{? it.enabled}}style="color: {{! it.color }}"{{?}} ></div>')).toBe(
				'export default function tpl(it: any) {\n    return <div {...(it.enabled ? { "style": { "color": `${it.color}`, } } : {})}></div>;\n}',
			);
		});

		it("should convert tag with `style` attribute dot encoded value in dot conditional", () => {
			expect(DotJsAst.toJsxString('<div style="color: {{? it.enabled}}{{! it.color }}{{??}}transparent{{?}};"></div>')).toBe(
				'export default function tpl(it: any) {\n    return <div style={{ "color": `${it.enabled ? `${it.color}` : `transparent`}`, }}></div>;\n}',
			);
		});

		it("should convert tag with `style` attribute with nested dot conditional (surrounding and in)", () => {
			expect(
				DotJsAst.toJsxString('<div style="{{? it.enabled}}color: {{? it.green }}green{{??}}{{! it.color }}{{?}};{{?}}"></div>'),
			).toBe(
				'export default function tpl(it: any) {\n    return <div style={{ ...(it.enabled ? { "color": `${it.green ? `green` : `${it.color}`}`, } : {  }), }}></div>;\n}',
			);
		});

		it("should convert tag with `style` attribute with nested dot conditional (both surrounding)", () => {
			expect(
				DotJsAst.toJsxString(
					'<div style="{{? it.enabled}}{{? it.green }}color: green;{{??}}color: {{! it.color }}; {{?}}{{??}}color: transparent;{{?}};"></div>',
				),
			).toBe(
				'export default function tpl(it: any) {\n    return <div style={{ ...(it.enabled ? (it.green ? {"color": "green", } : {"color": `${it.color}`,}) : { "color": "transparent",  }) }}></div>;\n}',
			);
		});

		it("should convert tag with `style` attribute with nested dot conditional (both in)", () => {
			expect(
				DotJsAst.toJsxString(
					'<div style="color: {{? it.enabled}}{{? it.green }}green{{??}}{{! it.color }}{{?}}{{??}}transparent{{?}};"></div>',
				),
			).toBe(
				'export default function tpl(it: any) {\n    return <div style={{ "color": `${it.enabled ? `${it.green ? `green` : `${it.color}`}` : `transparent`}`, }}></div>;\n}',
			);
		});

		it("should convert tag with `style` attribute with multiple dot encoded as value and surrounded by dot conditional", () => {
			expect(
				DotJsAst.toJsxString(
					'<div {{? it.enabled}}style="padding: {{! it.paddingTop }} {{! it.paddingRight }} {{! it.paddingBottom }} {{! it.paddingLeft }};"{{?}}></div>',
				),
			).toBe(
				'export default function tpl(it: any) {\n    return <div {...(it.enabled ? { "style": { "padding": `${it.paddingTop} ${it.paddingRight} ${it.paddingBottom} ${it.paddingLeft}`, } } : {})}></div>;\n}',
			);
		});

		it("should convert tag with multiple `style` attribute", () => {
			expect(
				DotJsAst.toJsxString('<div style="color: red; background-color: green; font-size: var(--foo);display:none;"></div>'),
			).toBe(
				'export default function tpl(it: any) {\n    return <div style={{"color":"red","backgroundColor":"green","fontSize":"var(--foo)","display":"none"}}></div>;\n}',
			);
		});

		it("should convert tag with not so valid `style` attribute", () => {
			expect(DotJsAst.toJsxString('<div style="color: red"></div>')).toBe(
				'export default function tpl(it: any) {\n    return <div style={{"color":"red"}}></div>;\n}',
			);
		});

		it("should convert tag with `style` attribute and variable", () => {
			expect(DotJsAst.toJsxString('<div style="background-color: red;color: {{! it.color }};"></div>')).toBe(
				'export default function tpl(it: any) {\n    return <div style={{ "backgroundColor": "red", "color": `${it.color}`, }}></div>;\n}',
			);
		});

		it("should convert tag with `style` attribute and string variable alone", () => {
			expect(DotJsAst.toJsxString('<div style="color: {{! it.color }};"></div>')).toBe(
				'export default function tpl(it: any) {\n    return <div style={{ "color": `${it.color}`, }}></div>;\n}',
			);
		});

		it("should convert tag with `style` attribute and string variable with other content", () => {
			expect(DotJsAst.toJsxString('<div style="padding: {{! it.padding }}px;"></div>')).toBe(
				'export default function tpl(it: any) {\n    return <div style={{ "padding": `${it.padding}px`, }}></div>;\n}',
			);
		});

		it("should convert tag with `style` attribute and conditional variable", () => {
			expect(DotJsAst.toJsxString('<div style="{{? it.color }}color: {{! it.color}};{{?}}"></div>')).toBe(
				'export default function tpl(it: any) {\n    return <div style={{ ...(it.color ? { "color": `${it.color}`, } : {  }), }}></div>;\n}',
			);
		});

		it("should convert tag with `style` attribute and conditional variable with other content", () => {
			expect(
				DotJsAst.toJsxString(
					'<div style="{{? it.padding }}padding: {{! it.padding}}px; margin: 0; color: {{! it.color}};{{?}}"></div>',
				),
			).toBe(
				'export default function tpl(it: any) {\n    return <div style={{ ...(it.padding ? { "padding": `${it.padding}px`, "margin": "0", "color": `${it.color}`, } : {  }), }}></div>;\n}',
			);
		});

		it("should convert tag with `style` attribute and if/else conditional variable with other content", () => {
			expect(
				DotJsAst.toJsxString(
					'<div style="{{? it.padding }}padding: {{! it.padding}}px; margin: 0;{{??}}padding: 0px; margin: 0;{{?}}"></div>',
				),
			).toBe(
				'export default function tpl(it: any) {\n    return <div style={{ ...(it.padding ? { "padding": `${it.padding}px`, "margin": "0",  } : { "padding": "0px", "margin": "0",  }), }}></div>;\n}',
			);
		});

		it("should evaluate correctly the content", () => {
			expect(DotJsAst.toJsxString('{{ const data = "data"; }}<div>{{! data }}</div>')).toBe(
				'export default function tpl(it: any) {\n    const data = "data";\n\nreturn <><div>{data}</div></>;\n}',
			);
		});

		it("should evaluate correctly the content with if statements inside", () => {
			expect(
				DotJsAst.toJsxString('{{ let data = "data"; if(true) { data += "1"; if(true) {data += "2"; } } }}<div>{{! data }}</div>'),
			).toBe(
				'export default function tpl(it: any) {\n    let data = "data"; if(true) { data += "1"; if(true) {data += "2"; } }\n\nreturn <><div>{data}</div></>;\n}',
			);
		});

		it("should evaluate correctly the content when there are multiple evaluation", () => {
			expect(DotJsAst.toJsxString('{{ const foo = "foo"; }} {{ const bar = "bar"; }}<div>{{! foo }}{{! bar }}</div>')).toBe(
				'export default function tpl(it: any) {\n    const foo = "foo";\nconst bar = "bar";\n\nreturn <><div>{foo}{bar}</div></>;\n}',
			);
		});

		it.todo("should convert `it.tpl.render` to React components and add imports", () => {
			expect(false).toBe(true);
		});
	});
});
