/**
 * @file ViewerComponent.jsx
 * @description
 * This component sets up a 3D BIM viewer using "openbim-components" and Three.js.
 * It loads an IFC model, allows users to select elements, and retrieves their properties.
 * When an element is selected, the component extracts its GlobalId and Name properties 
 * and passes them back up to the parent component via callback props.
 *
 * Key functionalities:
 * 1. Initializes the viewer and scene components.
 * 2. Loads an IFC model as fragments.
 * 3. Provides selection and highlighting of IFC elements.
 * 4. Retrieves properties of the selected element (e.g., GlobalId, Name).
 * 5. Uses callbacks `setSelectedGlobalId` and `setSelectedNameBim` to return the selected element's data.
 *
 * This component uses React.memo for optimization.
 */

import React, { useEffect, useState } from 'react';
import * as OBC from "openbim-components";
import * as THREE from "three";

const ViewerComponent = React.memo(({ setSelectedGlobalId, setSelectedNameBim }) => {
    const [modelCount, setModelCount] = useState(0);

    // Styles for the viewer container
    const viewerContainerStyle = {
        width: "100%",
        height: "500px",
        position: "relative",
        gridArea: "viewer",
    };

    // Initialize the main viewer components
    useEffect(() => {
        const viewer = new OBC.Components();
        const viewerContainer = document.getElementById("viewerContainer");

        if (!viewerContainer) {
            console.error("Viewer container not found.");
            return;
        }
        // Set up the scene component (manages Three.js scene)
        const sceneComponent = new OBC.SimpleScene(viewer);
        sceneComponent.setup();
        viewer.scene = sceneComponent;
        const scene = sceneComponent.get();
        // Renderer configuration with postprocessing capabilities
        const rendererComponent = new OBC.PostproductionRenderer(viewer, viewerContainer);
        viewer.renderer = rendererComponent;
        // Camera component (OrthoPerspective provides both orthographic and perspective views)
        const cameraComponent = new OBC.OrthoPerspectiveCamera(viewer);
        viewer.camera = cameraComponent;
        // Raycaster for selecting elements in the scene
        const raycasterComponent = new OBC.SimpleRaycaster(viewer);
        viewer.raycaster = raycasterComponent;
        // Initialize the viewer
        viewer.init();
        cameraComponent.updateAspect();
        rendererComponent.postproduction.enabled = true;
        // Add a simple grid to the scene
        const grid = new OBC.SimpleGrid(viewer, new THREE.Color(0x666666));
        // Exclude the grid from post-processing effects if necessary
        rendererComponent.postproduction.customEffects.excludedMeshes.push(grid.get());
        // FragmentManager handles loaded IFC fragments
        const fragmentManager = new OBC.FragmentManager(viewer);
        const ifcLoader = new OBC.FragmentIfcLoader(viewer);
        // IFC Loader to load IFC models as fragments
        const highlighter = new OBC.FragmentHighlighter(viewer);
        highlighter.setup();
        /**
                 * @function loadIfcAsFragments
                 * Loads an IFC model from a given path, converts it into fragments,
                 * and adds it to the scene.
                 *
                 * Complex logic:
                 * - Fetches IFC file data as an ArrayBuffer.
                 * - Uses FragmentIfcLoader to parse and create 3D fragments from IFC data.
                 * - Adds these fragments (representing IFC elements) to the Three.js scene.
                 */
        async function loadIfcAsFragments() {
            const file = await fetch('../modelos/Viaducto_cortazar.ifc');
            const data = await file.arrayBuffer();
            const buffer = new Uint8Array(data);
            const model = await ifcLoader.load(buffer, "example");
            scene.add(model);
        }
        loadIfcAsFragments();
        // IfcPropertiesProcessor extracts IFC properties from selected elements
        const propertiesProcessor = new OBC.IfcPropertiesProcessor(viewer);
        // Event: Clear selection (no element highlighted)
        highlighter.events.select.onClear.add(() => {
            propertiesProcessor.cleanPropertiesList();
            setSelectedGlobalId(null);
            setSelectedNameBim(null) // Callback to clear the selected global ID
        });
        // When IFC is loaded successfully:
        ifcLoader.onIfcLoaded.add(model => {
            setModelCount(fragmentManager.groups.length);
            propertiesProcessor.process(model);
            /**
             * @event onHighlight
             * Triggered when the user selects (highlights) an element in the 3D scene.
             * Complex logic:
             * - Extracts the selected fragment and element ID.
             * - Uses IfcPropertiesProcessor to retrieve all properties of the selected element.
             * - From these properties, finds the GlobalId and Name.
             * - Calls the provided callback functions to update selectedGlobalId and selectedNameBim states in the parent.
             */
            highlighter.events.select.onHighlight.add((selection) => {
                const fragmentID = Object.keys(selection)[0];
                const expressID = Number([...selection[fragmentID]][0]);
                const properties = propertiesProcessor.getProperties(model, expressID.toString());
                console.log(properties, '******** properties'); // Esto debería mostrarte todas las propiedades del objeto seleccionado.

                if (properties) {
                    // Attempt to find GlobalId property
                    const globalIdProperty = properties.find(prop => prop.Name === 'GlobalId' || (prop.GlobalId && prop.GlobalId.value));
                    // Attempt to find Name property
                    const nameProperty = properties.find(prop => prop.Name === 'Name' || (prop.Name && prop.Name.value));
                    const globalId = globalIdProperty ? globalIdProperty.GlobalId.value : 'No disponible';
                    const name = nameProperty ? nameProperty.Name.value : 'No disponible';



                    console.log(globalId, 'global id');
                    console.log(name);

                    // Update parent states with the selected element's globalId and name
                    setSelectedGlobalId(globalId);
                    setSelectedNameBim(name)
                }
            });


            // Update highlights after loading
            highlighter.update();
        });
        // Add a toolbar with IFC properties UI
        const mainToolbar = new OBC.Toolbar(viewer);
        mainToolbar.addChild(

            propertiesProcessor.uiElement.get("main")
        );
        viewer.ui.addToolbar(mainToolbar);
        // Cleanup function to dispose the viewer on component unmount
        return () => {
            if (viewer) {
                viewer.dispose();
            }
        };
    }, [setSelectedGlobalId, setSelectedNameBim]);

    return <div className='container' id="viewerContainer" style={viewerContainerStyle}></div>;
});

export default ViewerComponent;
