'use client';
import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment } from '@react-three/drei';
import './Lanyard.css';

function Card() {
  const { nodes, materials } = useGLTF('/models/card.glb') as any;
  
  return (
    <group scale={2}>
      <mesh geometry={nodes.card.geometry}>
        <meshStandardMaterial 
          map={materials.base.map}
          roughness={0.5}
          metalness={0.1}
        />
      </mesh>
      <mesh geometry={nodes.clip.geometry} material={materials.metal} />
      <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
    </group>
  );
}

export default function LanyardWorking() {
  return (
    <div className="lanyard-wrapper">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} />
        
        <Suspense fallback={null}>
          <Card />
          <OrbitControls 
            enableZoom={false}
            enablePan={false}
            autoRotate
            autoRotateSpeed={2}
            maxPolarAngle={Math.PI / 2}
            minPolarAngle={Math.PI / 3}
          />
          <Environment preset="studio" />
        </Suspense>
      </Canvas>
    </div>
  );
}
