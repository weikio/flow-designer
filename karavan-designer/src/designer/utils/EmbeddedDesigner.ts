export const EmbeddedDesigner = {
    isEnabled: (): boolean => {
        var result = document.getElementById("root")?.className.includes('simple-designer') ? true : false;

        return result;
    },

    yamlSource: (): string | undefined => {
        var result = document.getElementById("root")?.dataset.yamlurl;

        return result;
    },

    integrationName: (): string => {
        var result = document.getElementById("root")?.dataset.integrationname ?? "";

        return result;
    },

    coreSystemsSource: (): string | undefined => {
        var result = document.getElementById("root")?.dataset.coresystemsurl;

        return result;
    }
}