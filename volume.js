/* A three-dimensional slice of q -> q*q + c. The scalar part is q.x. */
const juliaVolume = (() => {
  const shader = `
    uniform vec3 u_eye;
    uniform vec3 u_right;
    uniform vec3 u_up;
    uniform vec2 u_aim;
    uniform float u_lens;
    uniform float u_slice;

    vec2 field(vec3 point) {
      vec4 q = vec4(point, u_slice);
      vec4 c = vec4(u_c, 0.28, -0.16);
      float derivative = 1.0;
      float radius = length(q);
      float trap = 2.0;
      for (int n = 0; n < 16; n++) {
        if (radius > 5.0) break;
        derivative *= max(2.0 * radius, 0.0001);
        q = vec4(q.x*q.x - dot(q.yzw, q.yzw), 2.0*q.x*q.yzw) + c;
        radius = length(q);
        trap = min(trap, abs(length(q.yz) - 0.54) + 0.12*abs(q.w));
      }
      return vec2(0.5 * log(max(radius, 1.0)) * radius / max(derivative, 0.0001), trap);
    }

    vec3 volume(vec2 uv) {
      vec3 ray = normalize(-normalize(u_eye) + u_right*(u_aim.x + uv.x/u_lens)
                                               + u_up*(u_aim.y + uv.y/u_lens));
      float sky = exp(-2.7*dot(uv - vec2(-0.38,0.28), uv - vec2(-0.38,0.28)));
      vec3 backdrop = vec3(0.061,0.083,0.095) + sky*vec3(0.055,0.090,0.092);
      float near = -dot(u_eye, ray);
      float disc = near*near - dot(u_eye,u_eye) + 2.56;
      if (disc <= 0.0) return backdrop;
      float travel = max(0.0, near - sqrt(disc));
      float far = near + sqrt(disc);
      float eps = max(0.00020, 1.10*near/(u_lens*min(u_resolution.x,u_resolution.y)));
      vec2 sampleValue;
      vec3 p;
      bool hit = false;
      float steps = 0.0;
      for (int n = 0; n < 100; n++) {
        p = u_eye + ray*travel;
        sampleValue = field(p);
        if (sampleValue.x < eps) { hit = true; break; }
        travel += max(eps*0.45, sampleValue.x*0.82);
        if (travel > far) break;
        steps += 1.0;
      }
      if (!hit) return backdrop;
      vec2 e = vec2(1.0,-1.0)*max(0.00045,eps*0.83);
      vec3 gradient = e.xyy*field(p+e.xyy).x + e.yyx*field(p+e.yyx).x
                    + e.yxy*field(p+e.yxy).x + e.xxx*field(p+e.xxx).x;
      vec3 n = length(gradient)>1e-10 ? normalize(gradient) : -ray;
      vec3 key = normalize(vec3(-0.62,0.78,0.46));
      vec3 fill = normalize(vec3(0.7,0.25,-0.66));
      float diffuse = max(dot(n,key),0.0);
      float rim = pow(1.0-clamp(dot(n,-ray),0.0,1.0),2.4);
      float ao = clamp(1.08-steps*0.009,0.32,1.0);
      float vein = exp(-14.0*sampleValue.y*u_trapStrength);
      float band = 0.5+0.5*cos(24.0*sqrt(sampleValue.y+0.0001) + 2.4*p.x);
      vec3 enamel = palette(0.28+0.78*band+0.18*p.z);
      vec3 metal = mix(enamel*enamel,vec3(0.83,0.42,0.12),vein*0.74);
      float shade = 1.0;
      float offset = 5.0*eps;
      for (int i=0; i<6; i++) {
        float clearance = field(p+n*2.5*eps+key*offset).x;
        shade = min(shade,clamp(7.0*clearance/offset,0.0,1.0));
        offset *= 2.3;
      }
      vec3 lit = metal*(0.20+1.42*diffuse*mix(0.34,1.0,shade))*ao;
      lit += vec3(0.12,0.49,0.56)*max(dot(n,fill),0.0)*0.55;
      lit += vec3(1.0,0.84,0.56)*pow(max(dot(n,normalize(key-ray)),0.0),27.0)*0.72;
      lit += u_glow*(0.32*rim*vec3(0.32,0.8,0.91)+0.14*vein*vec3(1.0,0.54,0.16));
      return pow(lit/(0.83+lit),vec3(0.72));
    }
  `;

  function basis(yaw, pitch) {
    const s = Math.sin(yaw), c = Math.cos(yaw);
    const h = Math.sin(pitch), v = Math.cos(pitch);
    return { eye: [3.3*s*v, 3.3*h, 3.3*c*v], right: [c, 0, -s], up: [-s*h, v, -c*h] };
  }

  // A sparse CPU preview of the same field lets flight planning run without GPU readbacks.
  function distance(x, y, z, w, real, imag) {
    let derivative = 1, radius = Math.hypot(x,y,z,w);
    for (let i = 0; i < 16 && radius <= 5; i++) {
      derivative *= Math.max(2*radius, 0.0001);
      const next = x*x-y*y-z*z-w*w+real;
      y = 2*x*y+imag;
      z = 2*x*z+0.28;
      w = 2*x*w-0.16;
      x = next;
      radius = Math.sqrt(x*x+y*y+z*z+w*w);
    }
    return 0.5*Math.log(Math.max(radius,1))*radius/Math.max(derivative,0.0001);
  }

  function findSurface(state) {
    const {eye,right,up} = basis(state.yaw,state.pitch);
    const depths = new Float32Array(81);
    for (let row=0; row<9; row++) {
      for (let col=0; col<9; col++) {
        const x = (col-4)*0.078, y = (row-4)*0.078;
        const ray = eye.map((v,i) => -v/3.3 + x*right[i] + y*up[i]);
        const norm = Math.hypot(...ray);
        let t = 1.7;
        for (let i=0; i<60 && t<4.9; i++) {
          const d = distance(eye[0]+ray[0]*t/norm,eye[1]+ray[1]*t/norm,
            eye[2]+ray[2]*t/norm,state.slice,state.cRe,state.cIm);
          if (d<0.004) { depths[row*9+col]=t; break; }
          t += 0.82*d;
        }
      }
    }
    let best = null, bestScore = -Infinity;
    for (let row=1; row<8; row++) {
      for (let col=1; col<8; col++) {
        const k = row*9+col, depth=depths[k];
        if (!depth) continue;
        let score = 0;
        for (const neighbor of [k-1,k+1,k-9,k+9]) {
          if (depths[neighbor]) score += 0.12+Math.min(Math.abs(depth-depths[neighbor]),0.5);
        }
        const x=(col-4)*0.078, y=(row-4)*0.078;
        score -= Math.hypot(x-state.aimX,y-state.aimY)*1.7;
        if (score>bestScore) { bestScore=score; best={x,y}; }
      }
    }
    return best;
  }
  return {shader,basis,findSurface};
})();
