const TransformControls = require( "../utils/TransformControls");
class ObjectRotationControl
{
    constructor(scene, camera, domElement, characterId)
    {
        this.control = new TransformControls(camera, domElement);
        this.control.rotationOnly = true;
        this.control.setMode('rotate');
        this.control.size = 0.2;
        this.domElement = domElement;
        this.control.userData.type = "objectControl";
        this.control.traverse(child => {
            child.userData.type = "objectControl";
        });
        this.object = null;
        this.scene = scene;
        this.control.characterId = characterId;
        this.isEnabled = false;
    }
    //#region Events
    onMouseDown = event => {this.object.isRotated = true;};
    onMouseMove = event => {this.updateCharacter(this.object.name, this.object.rotation);};
    onMouseUp = event => {this.object.isRotated = false; this.object.isRotationChanged = true;};
    //#enderegion

    selectObject(object, hitmeshid)
    {
        if(this.object !== null)
        {
            this.control.detach();
        }
        else if (object)
        {
            this.scene.add(this.control);
            this.control.addToScene();
        }
        this.control.objectId = hitmeshid;
        this.control.attach(object);
        this.object = object;
        this.control.addEventListener("transformMouseDown", this.onMouseDown, false);
        this.control.addEventListener("transformMoved", this.onMouseMove, false);
        this.control.addEventListener("transformMouseUp", this.onMouseUp, false);
    }

    setUpdateCharacter(updateCharacter)
    {
        this.updateCharacter = updateCharacter;
    }

    deselectObject()
    {
        this.control.detach();
        this.scene.remove(this.control);
        
        this.control.dispose();
        this.object = null;
        this.control.removeEventListener("transformMouseDown", this.onMouseDown);
        this.control.removeEventListener("transformMoved", this.onMouseMove);
        this.control.removeEventListener("transformMouseUp", this.onMouseUp);
    }

    setCamera(camera)
    {
        this.control.changeCamera(camera);
        this.control.updateMatrixWorld();
    }
}
module.exports = ObjectRotationControl;