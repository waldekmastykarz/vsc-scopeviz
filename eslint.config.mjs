import babelParser from "@babel/eslint-parser";

export default [{
    files: ["**/*.ts"],
}, {
    languageOptions: {
        parser: babelParser,
        ecmaVersion: 2022,
        sourceType: "module",
        parserOptions: {
            requireConfigFile: false,
            babelOptions: {
                babelrc: false,
                configFile: false,
                parserOpts: {
                    plugins: ["typescript"],
                },
            },
        },
    },

    rules: {
        curly: "warn",
        eqeqeq: "warn",
        "no-throw-literal": "warn",
        semi: "warn",
    },
}];
