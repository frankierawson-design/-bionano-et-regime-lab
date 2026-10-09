"""Compare JS midpoint propagation with SciPy's adaptive DOP853 ODE solver."""
import argparse, json, pathlib, subprocess
import numpy as np
from scipy.integrate import solve_ivp
ROOT=pathlib.Path(__file__).resolve().parent
parser=argparse.ArgumentParser();parser.add_argument('--module',type=pathlib.Path,required=True)
parser.add_argument('--output',type=pathlib.Path,default=pathlib.Path('surface_model_verification.json'))
args=parser.parse_args();MODULE=args.module.resolve().as_uri()
F=96485.33212;R=8.31446261815324;T=298.15;alpha=.4;k0=2;E0=.02
def potential(t): return .12-.1*t if t<=2.4 else -.12+.1*(t-2.4)
def rhs(t,y):
    x=F*(potential(t)-E0)/(R*T)
    return [k0*np.exp(-alpha*x)*(1-y[0])-k0*np.exp((1-alpha)*x)*y[0]]
reference=solve_ivp(rhs,[0,4.8],[.2],method='DOP853',rtol=2.3e-14,atol=1e-15,dense_output=True,max_step=.005)
assert reference.success
records=[]
for count in [500,1000,2000,4000]:
    ts=np.linspace(0,4.8,count+1);es=[potential(t) for t in ts]
    args=dict(timeS=ts.tolist(),potentialV=es,totalRedoxChargeC=1e-8,capacitanceF=2e-9,
              initialReduced=.2,k0PerS=k0,formalPotentialV=E0,alpha=alpha,n=1,temperatureK=T)
    code=f"import {{simulateSurfaceCV}} from {json.dumps(MODULE)};import {{readFileSync}} from 'node:fs';console.log(JSON.stringify(simulateSurfaceCV(JSON.parse(readFileSync(0,'utf8')))));"
    result=json.loads(subprocess.check_output(['node','--input-type=module','-e',code],input=json.dumps(args),text=True))
    theta=np.array([p['reducedFraction'] for p in result['points']]);exact=reference.sol(ts)[0]
    error=float(np.max(abs(theta-exact)))
    q=sum(r['faradaicCurrentA']*r['dtS'] for r in result['intervals'])
    records.append(dict(intervals=count,dt_s=4.8/count,max_occupancy_error=error,
                        integrated_charge_error_C=abs(q-1e-8*(.2-theta[-1])),
                        minimum_occupancy=float(theta.min()),maximum_occupancy=float(theta.max())))
assert records[-1]['max_occupancy_error']<1e-5
ratios=[records[j]['max_occupancy_error']/records[j+1]['max_occupancy_error'] for j in range(3)]
assert all(3.8<r<4.2 for r in ratios)
report={'reference':'SciPy adaptive DOP853, independently coded occupancy ODE',
        'rtol':2.3e-14,'atol':1e-15,'parameters':dict(k0PerS=k0,alpha=alpha,formalPotentialV=E0,n=1,temperatureK=T,initialReduced=.2),
        'status':'numerical verification of surface-model implementation; no experimental fit',
        'records':records,'successive_error_ratios':ratios}
args.output.parent.mkdir(parents=True,exist_ok=True)
args.output.write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
