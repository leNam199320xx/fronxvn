export function buildRuleString(className, props, indent = '    ', closeIndent) {
    const propsText = props.map(p => `${indent}${p}`).join('\n');
    const close = closeIndent !== undefined ? closeIndent : '';
    return `.${className} {\n${propsText}\n${close}}`;
}

export function buildMediaQueryString(media, ruleStrings) {
    return `@media ${media} {\n    ${ruleStrings.join('\n\n    ')}\n}`;
}
