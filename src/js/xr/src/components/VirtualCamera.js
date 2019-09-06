const THREE = require('three')
const { useMemo, useRef } = React = require('react')
const useGltf = require('../hooks/use-gltf')
const { useRender, useThree } = require('react-three-fiber')
require('../three/GPUPickers/utils/Object3dExtension')

const materialFactory = () => new THREE.MeshLambertMaterial({
  color: 0xcccccc,
  emissive: 0x0,
  flatShading: false
})

const meshFactory = source => {
  const mesh = source.clone()

  const material = materialFactory()

  if (mesh.material.map) {
    material.map = mesh.material.map
    material.map.needsUpdate = true
  }
  mesh.material = material

  return mesh
}

const VirtualCamera = React.memo(({ aspectRatio, sceneObject, isSelected, objectsToRender }) => {
  const filepath = useMemo(
    () => `/data/system/objects/camera.glb`,
    [sceneObject]
  )
  const { gl, scene } = useThree()
  const virtualCamera = useRef(null)
  const gltf = useGltf(filepath)
  const ref = useRef(null)
  const renderTarget = useRef(null)
  const size = 1 / 3
  const resolution = 512
  const previousTime = useRef([null])

  const renderCamera = () => {
    if (virtualCamera.current && renderTarget.current) {
      gl.vr.enabled = false
      scene.autoUpdate = false
      gl.setRenderTarget(renderTarget.current)
      gl.render(scene, virtualCamera.current)
      gl.setRenderTarget(null)
      scene.autoUpdate = true

      gl.vr.enabled = true
    }
  }

  useMemo(() => {
    if (isSelected) {
      renderCamera()
    } else {

    }
  }, [ref.current, isSelected])

  useRender(() => {
    if (!previousTime.current) previousTime.current = 0

    const currentTime = Date.now()
    const delta = currentTime - previousTime.current

    if (delta > 500) {
      previousTime.current = currentTime
    } else {
      if ((!isSelected && !sceneObject.isClose)) return
    }

    renderCamera()
  }, false, [isSelected])

  useMemo(() => {
    for (let i = 0, n = objectsToRender.length; i < n; i++) {
      objectsToRender[i].traverse(object => object.layers.enable(1))
    }
  }, [objectsToRender])

  useMemo(() => {
    if (virtualCamera.current) {
      virtualCamera.current.layers.set(1)
    }
  }, [virtualCamera.current])

  useMemo(() => {
    if (!renderTarget.current) {
      renderTarget.current = new THREE.WebGLRenderTarget(resolution * aspectRatio, resolution)
    }
  }, [sceneObject])

  const mesh = useMemo(() => {
    if (gltf) {
      const children = []
      gltf.scene.traverse(child => {
        if (child.isMesh) {
          children.push(
            <primitive
              key={sceneObject.id}
              object={meshFactory(child)}
            />
          )
        }
      })
      return children
    }
    return []
  }, [gltf])

  const heightShader = useMemo(
    () => new THREE.MeshBasicMaterial({
      map: renderTarget.current.texture,
      side: THREE.FrontSide
    }),
    [renderTarget.current]
  )

  const cameraView = useMemo(() => {
    return <group>
      <mesh
        userData={{ type: 'view' }}
        position={[0, 0.3, 0]}
        material={heightShader}
      >
        <planeGeometry attach='geometry' args={[size * aspectRatio, size]} />
      </mesh>
    </group>
  }, true)

  return <group
    ref={ref}
    onController={sceneObject.visible ? () => null : null}
    userData={{
      type: 'virtual-camera',
      id: sceneObject.id
    }}
    renderCamera={renderCamera}
    position={[sceneObject.x, sceneObject.z, sceneObject.y]}
    rotation={[sceneObject.tilt, sceneObject.rotation, sceneObject.roll]}

  >
    {cameraView}
    {mesh}
    <group position={[0, 0, -0.2]}>
      <perspectiveCamera
        name={''}
        ref={virtualCamera}
        aspect={aspectRatio}
        fov={sceneObject.fov}
        near={0.01}
        far={1000}
        onUpdate={self => self.updateProjectionMatrix()}
      />
    </group>
  </group>
})
module.exports = VirtualCamera
