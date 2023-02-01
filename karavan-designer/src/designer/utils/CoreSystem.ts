export class CoreSystem {
    name: string = "";
    title: string = "";
    description: string = "";
    category: string = "";
    type: string = "";
    parameters: string[] = [];

    public constructor(init?: Partial<CoreSystem>) {
        Object.assign(this, init);
    }
}