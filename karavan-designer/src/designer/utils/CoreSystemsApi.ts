import { CoreSystem } from "./CoreSystem";
import { ComponentApi } from 'karavan-core/lib/api/ComponentApi';
import { KameletApi } from 'karavan-core/lib/api/KameletApi';


export const CoreSystems: CoreSystem[] = [];

export const CoreSystemsApi = {
    saveCoreSystems: (jsons: string[], clean: boolean = false) => {
        if (clean) CoreSystems.length = 0;
        const coreSystems: CoreSystem[] = jsons.map(json => CoreSystemsApi.jsonToCoreSystem(json));
        CoreSystems.push(...coreSystems);
    },
    getCoreSystems: (): CoreSystem[] => {
        return CoreSystems.sort((a, b) => {
            if (a.name < b.name) {
                return -1;
            }
            return a.name > b.name ? 1 : 0;
        });
    },
    jsonToCoreSystem: (json: string) => {
        const fromJson: CoreSystem = JSON.parse(json) as CoreSystem;
        const k: CoreSystem = new CoreSystem(fromJson);
        return k;
    },
    getIsPathParameter: (camelType: string, type: 'consumer' | "producer", parameterName: string): boolean => {
        if (camelType.startsWith("kamelet")) {
            return false;
        }

        const componentParameters = ComponentApi.getComponentProperties(camelType, type);
        const parameter = componentParameters.filter(p => p.name == parameterName)[0];
        const isPath = parameter?.kind == "path" ?? false;

        return isPath;
    }
}