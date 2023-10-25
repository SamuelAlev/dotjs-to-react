import { expect, test } from '@playwright/test';

const DIVIDER_CODE_DOT = `<div class="co-settings__divider
            co-settings__divider--{{! it.size }}
            {{! it.hasNegativeMargin ? 'co-settings__divider--negative-margin' : '' }}">
    {{? it.size === 'large' && it.title }}
        <div class="co-settings__divider-title">{{! it.title }}</div>
    {{?}}

    {{? it.size === 'large' && it.setting }}
        <div class="co-settings__divider-setting">{{= /* is HTML */ it.setting }}</div>
    {{?}}
</div>`;

const EXPECTED_DIVIDER_CODE_TSX = `import parseHtml from "html-react-parser";

export default function tpl(it: any) {
  return (
    <div
      className={\`co-settings__divider co-settings__divider--\${it.size} \${
        it.hasNegativeMargin ? "co-settings__divider--negative-margin" : ""
      }\`}
    >
      {it.size === "large" && it.title ? (
        <div className="co-settings__divider-title">{it.title}</div>
      ) : null}
      {it.size === "large" && it.setting ? (
        <div className="co-settings__divider-setting">
          {parseHtml(it.setting)}
        </div>
      ) : null}
    </div>
  );
}`;

const EXPECTED_DIVIDER_CODE_AST =
    '{type: "root"children: [0: {type: "element"tagName: "div"attributes: [0: {type: "attribute"name: "class"children: [0: {type: "text"value: "co-settings__divider co-settings__divider--"}1: {type: "dotEncoded"value: "it.size"}2: {type: "text"value: " "}3: {type: "dotEncoded"value: "it.hasNegativeMargin ? \'co-settings__divider--negative-margin\' : \'\'"}]}]children: [0: {type: "text"value: " "}1: {type: "dotConditional"test: "it.size === \'large\' && it.title"children: [0: {type: "text"value: " "}1: {type: "element"tagName: "div"attributes: [0: {type: "attribute"name: "class"children: [0: {type: "text"value: "co-settings__divider-title"}]}]children: [0: {type: "dotEncoded"value: "it.title"}]}2: {type: "text"value: " "}]}2: {type: "text"value: " "}3: {type: "dotConditional"test: "it.size === \'large\' && it.setting"children: [0: {type: "text"value: " "}1: {type: "element"tagName: "div"attributes: [0: {type: "attribute"name: "class"children: [0: {type: "text"value: "co-settings__divider-setting"}]}]children: [0: {type: "dotInterpolated"value: "it.setting"}]}2: {type: "text"value: " "}]}]}]}';

test('converts the doT input code to TSX', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('dotjs-input').fill(DIVIDER_CODE_DOT);

    await expect(page.getByTestId('tsx-output')).toHaveText(EXPECTED_DIVIDER_CODE_TSX);
});

test('converts the doT input code into an AST tree view', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('dotjs-input').fill(DIVIDER_CODE_DOT);

    await expect(page.getByTestId('ast-output')).toHaveText(EXPECTED_DIVIDER_CODE_AST);
});

test('has the github repo clickable', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('github-repo-link').click();

    await expect(page).toHaveURL(/github.com/);
});
