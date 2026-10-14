import { useEffect, useRef, useState } from 'react';
import { TrendingUp } from 'lucide-react';

/** Decorative market sculpture; no prices or performance claims. */
export default function LandingMarketScene() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let teardown: (() => void) | undefined;

    void import('three').then((THREE) => {
      if (disposed) return;
      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
      } catch {
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setClearAlpha(0);
      renderer.domElement.setAttribute('aria-hidden', 'true');
      host.appendChild(renderer.domElement);
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
      camera.position.set(0, 0.15, 8);
      const token = (name: string) => {
        const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
        return new THREE.Color(`hsl(${value.split(/\s+/).join(',')})`);
      };
      const gold = new THREE.MeshStandardMaterial({ color: token('--gold'), metalness: 0.62, roughness: 0.25 });
      const edge = new THREE.MeshStandardMaterial({ color: token('--gold-light'), metalness: 0.7, roughness: 0.21 });
      const darkGold = new THREE.MeshStandardMaterial({ color: token('--gold-dark'), metalness: 0.48, roughness: 0.34 });
      const green = new THREE.MeshStandardMaterial({ color: token('--buy'), metalness: 0.32, roughness: 0.3 });
      const red = new THREE.MeshStandardMaterial({ color: token('--sell'), metalness: 0.32, roughness: 0.3 });
      scene.add(new THREE.HemisphereLight(token('--card'), token('--gold-dark'), 3));
      const key = new THREE.DirectionalLight(token('--primary-foreground').lerp(new THREE.Color(1, 1, 1), 0.95), 5);
      key.position.set(-3, 5, 7);
      scene.add(key);
      const rim = new THREE.DirectionalLight(token('--gold-light'), 3);
      rim.position.set(4, -1, 3);
      scene.add(rim);

      const sculpture = new THREE.Group();
      scene.add(sculpture);
      const coin = new THREE.Group();
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.22, 1.22, 0.26, 80), gold);
      disc.rotation.x = Math.PI / 2;
      coin.add(disc);
      for (const z of [-0.14, 0.14]) {
        const border = new THREE.Mesh(new THREE.TorusGeometry(1.09, 0.045, 10, 80), edge);
        border.position.z = z;
        coin.add(border);
      }
      const dollar = new THREE.Group();
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.36, 0.48, 0), new THREE.Vector3(-0.05, 0.62, 0),
        new THREE.Vector3(-0.4, 0.36, 0), new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.4, -0.3, 0), new THREE.Vector3(0.05, -0.61, 0),
        new THREE.Vector3(-0.37, -0.47, 0),
      ]);
      dollar.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 50, 0.09, 10, false), edge));
      const stem = new THREE.Mesh(new THREE.BoxGeometry(0.075, 1.6, 0.08), edge);
      dollar.add(stem);
      dollar.position.z = 0.2;
      coin.add(dollar);
      coin.position.set(-2.35, 0.05, 0);
      coin.rotation.set(-0.15, 0.38, -0.13);
      sculpture.add(coin);

      const chart = new THREE.Group();
      const candles: InstanceType<typeof THREE.Group>[] = [];
      [0.8, 1.25, 0.9, 1.65, 1.2, 1.85].forEach((height, i) => {
        const candle = new THREE.Group();
        const material = i === 2 || i === 4 ? red : green;
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.27, height, 0.28), material);
        const wick = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, height + 0.5, 8), material);
        candle.add(body, wick);
        candle.position.set(i * 0.47, (i * 0.12) + height / 2 - 1.1, 0);
        chart.add(candle);
        candles.push(candle);
      });
      chart.position.set(0.35, -0.05, 0);
      chart.rotation.set(0.08, -0.24, -0.05);
      sculpture.add(chart);

      const arrowShape = new THREE.Shape();
      arrowShape.moveTo(-0.8, -0.38);
      arrowShape.lineTo(0.05, 0.4);
      arrowShape.lineTo(-0.15, 0.6);
      arrowShape.lineTo(0.85, 0.6);
      arrowShape.lineTo(0.85, -0.38);
      arrowShape.lineTo(0.62, -0.16);
      arrowShape.lineTo(-0.45, -0.76);
      arrowShape.closePath();
      const arrow = new THREE.Mesh(new THREE.ExtrudeGeometry(arrowShape, { depth: 0.15, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.06, bevelThickness: 0.06 }), darkGold);
      arrow.position.set(3.8, 0.35, -0.8);
      arrow.rotation.set(0.15, -0.15, 0.15);
      arrow.scale.setScalar(0.7);
      sculpture.add(arrow);

      let frame = 0;
      let visible = true;
      let targetX = 0;
      let targetY = 0;
      let elapsed = 0;
      let previousTime = 0;
      const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
      const render = () => renderer.render(scene, camera);
      const resize = () => {
        const { width, height } = host.getBoundingClientRect();
        if (!width || !height) return;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        const viewWidth = 2 * Math.tan(THREE.MathUtils.degToRad(16)) * 8 * camera.aspect;
        sculpture.scale.setScalar(Math.min(1, viewWidth / 10.8));
        render();
      };
      const animate = (time: number) => {
        frame = 0;
        elapsed += previousTime ? Math.min((time - previousTime) / 1000, 0.05) : 0;
        previousTime = time;
        coin.rotation.y = 0.38 + Math.sin(elapsed * 0.65) * 0.32;
        coin.position.y = Math.sin(elapsed * 0.85) * 0.16;
        chart.position.y = Math.sin(elapsed * 0.7 + 1) * 0.08;
        candles.forEach((candle, i) => { candle.scale.y = 1 + Math.sin(elapsed * 1.2 + i * 0.9) * 0.08; });
        arrow.position.y = 0.35 + Math.sin(elapsed * 0.9 + 2) * 0.18;
        sculpture.rotation.y += (targetX * 0.1 - sculpture.rotation.y) * 0.04;
        sculpture.rotation.x += (targetY * 0.05 - sculpture.rotation.x) * 0.04;
        render();
        if (visible && !document.hidden && !motion.matches) frame = requestAnimationFrame(animate);
      };
      const sync = () => {
        cancelAnimationFrame(frame);
        frame = 0;
        previousTime = 0;
        if (visible && !document.hidden && !motion.matches) frame = requestAnimationFrame(animate);
        else render();
      };
      const pointer = (event: PointerEvent) => {
        const bounds = host.getBoundingClientRect();
        targetX = (event.clientX - bounds.left) / bounds.width - 0.5;
        targetY = (event.clientY - bounds.top) / bounds.height - 0.5;
      };
      const leave = () => { targetX = 0; targetY = 0; };
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(host);
      const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
      intersection.observe(host);
      const themeObserver = new MutationObserver(() => {
        gold.color.copy(token('--gold')); edge.color.copy(token('--gold-light'));
        darkGold.color.copy(token('--gold-dark')); green.color.copy(token('--buy')); red.color.copy(token('--sell'));
        render();
      });
      themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      host.addEventListener('pointermove', pointer);
      host.addEventListener('pointerleave', leave);
      document.addEventListener('visibilitychange', sync);
      motion.addEventListener('change', sync);
      resize();
      sync();
      setReady(true);
      teardown = () => {
        cancelAnimationFrame(frame);
        resizeObserver.disconnect(); intersection.disconnect(); themeObserver.disconnect();
        host.removeEventListener('pointermove', pointer); host.removeEventListener('pointerleave', leave);
        document.removeEventListener('visibilitychange', sync); motion.removeEventListener('change', sync);
        scene.traverse((object) => { if (object instanceof THREE.Mesh) object.geometry.dispose(); });
        [gold, edge, darkGold, green, red].forEach((material) => material.dispose());
        renderer.dispose(); renderer.domElement.remove();
      };
    }).catch(() => { /* Keep the lightweight fallback if WebGL is unavailable. */ });
    return () => { disposed = true; teardown?.(); };
  }, []);

  return (
    <div className="market-scene" ref={hostRef} aria-hidden="true" data-scene-ready={ready}>
      {!ready && <div className="market-scene-fallback"><TrendingUp /></div>}
    </div>
  );
}