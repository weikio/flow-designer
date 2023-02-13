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
    },

    disableApi: (): boolean => {
        var result = document.getElementById("root")?.dataset.disableapi ?? "";

        return result.toLocaleLowerCase() == "true";
    },

    apiFirst: (): boolean => {
        var result = document.getElementById("root")?.dataset.apifirst ?? "";

        return result.toLocaleLowerCase() == "true";
    }
}