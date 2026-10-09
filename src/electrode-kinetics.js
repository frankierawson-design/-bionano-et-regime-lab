/** Surface-confined, noninteracting redox occupancy under Butler–Volmer rates.
 * No diffusion, uncompensated resistance, optical calibration or biological fit.
 * k0 is s^-1 for this surface model, not the m/s solution-phase rate constant.
 */
export const FARADAY = 96485.33212;
export const GAS_CONSTANT = 8.31446261815324;

function finite(name, value) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be finite`);
}

export function surfaceRates(potentialV, { k0PerS, formalPotentialV, alpha = 0.5, n = 1, temperatureK = 298.15 }) {
  for (const [name,value] of Object.entries({potentialV,k0PerS,formalPotentialV,alpha,n,temperatureK})) finite(name,value);
  if (k0PerS < 0 || !(alpha > 0 && alpha < 1) || !Number.isInteger(n) || n < 1 || temperatureK <= 0) {
    throw new RangeError('Require k0 >= 0, 0 < alpha < 1, integer n >= 1 and T > 0');
  }
  const x = n * FARADAY * (potentialV - formalPotentialV) / (GAS_CONSTANT * temperatureK);
  const reductionPerS = k0PerS === 0 ? 0 : Math.exp(Math.log(k0PerS) - alpha * x);
  const oxidationPerS = k0PerS === 0 ? 0 : Math.exp(Math.log(k0PerS) + (1-alpha) * x);
  if (!Number.isFinite(reductionPerS + oxidationPerS)) throw new RangeError('Rates exceed floating-point range');
  // Stable Nernst reduced-state fraction, also defined in the zero-rate limit.
  const equilibriumReduced = x >= 0 ? Math.exp(-x)/(1+Math.exp(-x)) : 1/(1+Math.exp(x));
  return { reductionPerS, oxidationPerS, equilibriumReduced };
}

export function advanceSurfaceOccupancy(reducedFraction, potentialV, dtS, parameters) {
  finite('reducedFraction',reducedFraction); finite('dtS',dtS);
  if (reducedFraction < 0 || reducedFraction > 1 || dtS < 0) throw new RangeError('Require theta in [0,1] and dt >= 0');
  const rates = surfaceRates(potentialV,parameters);
  const lambda = rates.reductionPerS + rates.oxidationPerS;
  // Exact constant-potential solution; a convex combination preserves occupancy.
  const moved = -Math.expm1(-lambda * dtS);
  return reducedFraction * (1-moved) + rates.equilibriumReduced * moved;
}

export function simulateSurfaceCV({ timeS, potentialV, totalRedoxChargeC, capacitanceF = 0, initialReduced, ...parameters }) {
  if (!Array.isArray(timeS) || !Array.isArray(potentialV) || timeS.length !== potentialV.length || timeS.length < 2) {
    throw new RangeError('Supply equal-length time and potential arrays with at least two points');
  }
  finite('totalRedoxChargeC',totalRedoxChargeC); finite('capacitanceF',capacitanceF);
  if (totalRedoxChargeC <= 0 || capacitanceF < 0) throw new RangeError('Require total redox charge > 0 and capacitance >= 0');
  timeS.forEach(t=>finite('timeS',t)); potentialV.forEach(e=>finite('potentialV',e));
  const initialRates=surfaceRates(potentialV[0],parameters);
  let theta=initialReduced ?? initialRates.equilibriumReduced;
  if (!Number.isFinite(theta) || theta < 0 || theta > 1) throw new RangeError('Initial reduced fraction must be in [0,1]');
  const points=[{timeS:timeS[0],potentialV:potentialV[0],reducedFraction:theta}];
  const intervals=[];
  for(let j=1;j<timeS.length;j++) {
    const dt=timeS[j]-timeS[j-1];
    if (!(dt>0)) throw new RangeError('Times must be strictly increasing');
    const midpointPotentialV=(potentialV[j]+potentialV[j-1])/2;
    const next=advanceSurfaceOccupancy(theta,midpointPotentialV,dt,parameters);
    // Interval-average Faradaic current: anodic positive, reduction negative.
    const faradaicCurrentA=-totalRedoxChargeC*(next-theta)/dt;
    const chargingCurrentA=capacitanceF*(potentialV[j]-potentialV[j-1])/dt;
    intervals.push({timeS:(timeS[j]+timeS[j-1])/2,potentialV:midpointPotentialV,
      faradaicCurrentA,chargingCurrentA,totalCurrentA:faradaicCurrentA+chargingCurrentA,dtS:dt});
    theta=next;points.push({timeS:timeS[j],potentialV:potentialV[j],reducedFraction:theta});
  }
  return {points,intervals,model:'surface-confined Butler-Volmer',k0Units:'s^-1',
    experimentalFit:false,includesDiffusion:false,includesUncompensatedResistance:false};
}
