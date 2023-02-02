/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as React from "react";
import {
    Alert,
    AlertActionCloseButton, AlertGroup,
    Bullseye, Button, Divider, Flex, FlexItem,
    Page, Spinner, Tooltip,
} from "@patternfly/react-core";
import { KameletApi } from "karavan-core/lib/api/KameletApi";
import { ComponentApi } from "karavan-core/lib/api/ComponentApi";
import { KameletsPage } from "./kamelets/KameletsPage";
import { ComponentsPage } from "./components/ComponentsPage";
import { EipPage } from "./eip/EipPage";
import { BlueprintIcon } from "@patternfly/react-icons";
import KameletsIcon from "@patternfly/react-icons/dist/js/icons/registry-icon";
import EipIcon from "@patternfly/react-icons/dist/js/icons/topology-icon";
import ComponentsIcon from "@patternfly/react-icons/dist/js/icons/module-icon";
import { KaravanIcon } from "./designer/utils/KaravanIcons";
import './designer/karavan.css';
import { DesignerPage } from "./DesignerPage";
import { TemplateApi } from "karavan-core/lib/api/TemplateApi";
import { CoreSystemsApi } from "./designer/utils/CoreSystemsApi";
import { EmbeddedDesigner } from "./designer/utils/EmbeddedDesigner";

class ToastMessage {
    id: string = ''
    text: string = ''
    title: string = ''
    variant?: 'success' | 'danger' | 'warning' | 'info' | 'default';

    constructor(title: string, text: string, variant: 'success' | 'danger' | 'warning' | 'info' | 'default') {
        this.id = Date.now().toString().concat(Math.random().toString());
        this.title = title;
        this.text = text;
        this.variant = variant;
    }
}

class MenuItem {
    pageId: string = '';
    tooltip: string = '';
    icon: any;

    constructor(pageId: string, tooltip: string, icon: any) {
        this.pageId = pageId;
        this.tooltip = tooltip;
        this.icon = icon;
    }
}

interface Props {
}

interface State {
    name: string
    yaml: string
    key: string
    loaded?: boolean,
    pageId: string,
    alerts: ToastMessage[],
}

class App extends React.Component<Props, State> {

    public state: State = {
        pageId: "designer",
        alerts: [],
        name: 'example.yaml',
        key: '',
        yaml: ''
    }

    toast = (title: string, text: string, variant: 'success' | 'danger' | 'warning' | 'info' | 'default') => {
        const mess = [];
        mess.push(...this.state.alerts, new ToastMessage(title, text, variant));
        this.setState({ alerts: mess })
    }

    deleteErrorMessage = (id: string) => {
        this.setState({ alerts: this.state.alerts.filter(a => a.id !== id) })
    }

    componentDidMount() {
        const yamlFileName = localStorage.getItem("yamlFileName");

        let integrationName = EmbeddedDesigner.integrationName();
        if (integrationName === "") {
            integrationName = localStorage.getItem("integrationName") ?? "example";
        }

        const yamlSource = EmbeddedDesigner.yamlSource();

        const promises = [
            fetch("kamelets/kamelets.yaml"),
            fetch("components/components.json"),
            fetch("snippets/org.apache.camel.AggregationStrategy"),
            fetch("snippets/org.apache.camel.Processor")
        ];

        if (yamlSource) {
            promises.push(fetch(yamlSource));
        }
        else if (yamlFileName != "") {
            promises.push(fetch("routes/" + yamlFileName));
        }

        let coreSystemsSource = EmbeddedDesigner.coreSystemsSource();
        if (coreSystemsSource) {
            promises.push(fetch(coreSystemsSource));
        }
        else {
            promises.push(fetch("coresystems/systems.json"));
        }

        Promise.all(promises).then(responses =>
            Promise.all(responses.map(response => response.text()))
        ).then(data => {
            const kamelets: string[] = [];
            data[0].split("\n---\n").map(c => c.trim()).forEach(z => kamelets.push(z));
            KameletApi.saveKamelets(kamelets, true);

            const components: [] = JSON.parse(data[1]);
            const jsons: string[] = [];
            components.forEach(c => jsons.push(JSON.stringify(c)));
            ComponentApi.saveComponents(jsons, true);

            TemplateApi.saveTemplate("org.apache.camel.AggregationStrategy", data[2]);
            TemplateApi.saveTemplate("org.apache.camel.Processor", data[3]);

            if (data[4] != null) {
                this.save(integrationName, data[4], false);
            }

            const coresystems: [] = JSON.parse(data[5]);
            const corejsons: string[] = [];
            coresystems.forEach(c => corejsons.push(JSON.stringify(c)));
            CoreSystemsApi.saveCoreSystems(corejsons, true);

            if (EmbeddedDesigner.isEnabled() == false) {
                this.toast("Success", "Loaded " + jsons.length + " components", 'success');
                this.toast("Success", "Loaded " + kamelets.length + " kamelets", 'success');
                this.toast("Success", "Loaded " + corejsons.length + " core systems", 'success');
                this.toast("Success YAML Loaded", data[4], 'success');
            }

            this.setState({ loaded: true });
        })
            .then(() => {
            }).catch(err =>
                this.toast("Error", err.text, 'danger')
            );
    }

    save(filename: string, yaml: string, propertyOnly: boolean) {
        this.setState({ name: filename, yaml: yaml });
        const saveEvent = new CustomEvent("designer-event", { detail: { eventType: "yaml-changed", name: filename, yaml: yaml } });

        document.dispatchEvent(saveEvent);
    }

    getSpinner() {
        return (
            <Bullseye className="loading-page">
                <Spinner className="progress-stepper" isSVG diameter="80px" aria-label="Loading..." />
            </Bullseye>
        )
    }

    pageNav = () => {
        const { pageId } = this.state;
        const pages: MenuItem[] = [
            new MenuItem("designer", "Designer", <BlueprintIcon />),
            new MenuItem("kamelets", "Basic", <KameletsIcon />),
            new MenuItem("components", "Advanced", <ComponentsIcon />),
        ]
        return (<Flex className="nav-buttons" direction={{ default: "column" }} style={{ height: "100%" }}
            spaceItems={{ default: "spaceItemsNone" }}>
            <FlexItem alignSelf={{ default: "alignSelfCenter" }}>
                <Tooltip className="logo-tooltip" content={"Apache Camel Karavan"}
                    position={"right"}>
                    {KaravanIcon()}
                </Tooltip>
            </FlexItem>
            {pages.map(page =>
                <FlexItem key={page.pageId} className={pageId === page.pageId ? "nav-button-selected" : ""}>
                    <Tooltip content={page.tooltip} position={"right"}>
                        <Button id={page.pageId} icon={page.icon} variant={"plain"}
                            className={pageId === page.pageId ? "nav-button-selected" : ""}
                            onClick={event => this.setState({ pageId: page.pageId })}
                        />
                    </Tooltip>
                </FlexItem>
            )}
            <FlexItem flex={{ default: "flex_2" }} alignSelf={{ default: "alignSelfCenter" }}>
                <Divider />
            </FlexItem>
        </Flex>)
    }

    getPage() {
        const { key, name, yaml, pageId } = this.state;
        const dark = document.body.className.includes('vscode-dark');
        switch (pageId) {
            case "designer":
                return (
                    <DesignerPage
                        name={name}
                        yaml={yaml}
                        onSave={(filename, yaml1, propertyOnly) => this.save(filename, yaml1, propertyOnly)}
                        dark={dark} />
                )
            case "kamelets":
                return (
                    <KameletsPage dark={dark} />
                )
            case "components":
                return (
                    <ComponentsPage dark={dark} />
                )
            case "eip":
                return (
                    <EipPage dark={dark} />
                )
        }
    }

    public render() {
        const { loaded } = this.state;
        const simple = EmbeddedDesigner.isEnabled();

        return (
            <Page className="karavan">
                <AlertGroup isToast isLiveRegion>
                    {this.state.alerts.map((e: ToastMessage) => (
                        <Alert key={e.id} className="main-alert" variant={e.variant} title={e.title}
                            timeout={e.variant === "success" ? 2000 : 10000}
                            actionClose={<AlertActionCloseButton onClose={() => this.deleteErrorMessage(e.id)} />}>
                            {e.text}
                        </Alert>
                    ))}
                </AlertGroup>
                <>
                    <Flex direction={{ default: "row" }} style={{ width: "100%", height: "100%" }}
                        alignItems={{ default: "alignItemsStretch" }} spaceItems={{ default: 'spaceItemsNone' }}>
                        {simple == false? (<FlexItem>
                            {this.pageNav()}
                        </FlexItem>
                        ) : (<div />)}
                        <FlexItem flex={{ default: "flex_2" }} style={{ height: "100%" }}>
                            {loaded !== true && this.getSpinner()}
                            {loaded === true && this.getPage()}
                        </FlexItem>
                    </Flex>
                </>
            </Page>
        )
    }
}

export default App;
