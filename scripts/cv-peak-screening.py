"""Screen archived CV features; do not assign a redox couple automatically.

Run: python analyse_peaks.py --source source --output outputs
Only original potential/time/current columns are read. Blank subtraction is
branch matched. Features and slopes are descriptive, not fitted rate constants.
"""
from pathlib import Path
import argparse, hashlib, json
import numpy as np
import pandas as pd
import openpyxl
from scipy.signal import find_peaks, savgol_filter
from scipy.stats import linregress
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt


def branches(a):
    """Exclude short terminal reverse segment; retain first full down/up sweeps."""
    lo = int(np.argmin(a[:, 0]))
    hi = lo + int(np.argmax(a[lo:, 0]))
    return {'cathodic': a[:lo+1], 'anodic': a[lo:hi+1]}


def subtract(a, b):
    order = np.argsort(b[:, 0])
    x, index = np.unique(b[order, 0], return_index=True)
    if a[:,0].min() < x.min()-0.005 or a[:,0].max() > x.max()+0.005:
        raise ValueError('Matched control does not cover sample potential range')
    return a[:,2] - np.interp(a[:,0], x, b[order,2][index])


def candidates(x, y, branch, window):
    sign = -1 if branch == 'cathodic' else 1
    smooth = savgol_filter(y, window, 3)
    # 5 nA or 2% of the interior branch range, whichever is larger.
    interior = (x > -.9) & (x < .85)
    threshold = max(5e-9, .02*np.ptp(smooth[interior]))
    inds, props = find_peaks(sign*smooth, prominence=threshold, distance=20)
    return [(int(k), float(p), float(smooth[k])) for k,p in
            zip(inds, props['prominences']) if -.9 < x[k] < .85]


def run(source, out):
    out.mkdir(parents=True,exist_ok=True)
    data, audit = {}, []
    for p in sorted((source/'cv_archive/SR POR/260917').glob('*.xlsx')):
        values = list(openpyxl.load_workbook(p,data_only=True).active.values)
        a = np.array([r[:6] for r in values[1:]],float)
        a = a[np.isfinite(a[:,:3]).all(axis=1)]
        g,v = p.stem.rsplit(' ',1); v=float(v)/1000
        b = branches(a); data[g,v]=b
        audit.append(dict(file=str(p.relative_to(source)),sha256=hashlib.sha256(p.read_bytes()).hexdigest(),
                          group=g,scan_rate_V_s=v,rows=len(a),scan_labels=sorted(set(a[:,4])),
                          measured_scan_rate_V_s=float(np.median(abs(np.diff(a[:,0])/np.diff(a[:,1])))),
                          initial_potential_V=float(a[0,0]),last_potential_V=float(a[-1,0]),
                          cathodic_rows=len(b['cathodic']),anodic_rows=len(b['anodic'])))
    if len(data)!=32: raise ValueError('Expected four conditions at eight rates')
    pd.DataFrame(audit).to_csv(out/'source_audit.csv',index=False)
    features=[]; chosen=[];processed={}
    for (g,v),b in data.items():
        for branch,a in b.items():
            treatments={'raw':a[:,2]}
            if g!='PBS': treatments['minus_PBS']=subtract(a,data['PBS',v][branch])
            if g=='AuNPs+Por': treatments['minus_AuNPs']=subtract(a,data['AuNPs',v][branch])
            for treatment,y in treatments.items():
                processed[g,v,branch,treatment]=(a[:,0],y)
                for window in [11,31,61]:
                    for k,p,ys in candidates(a[:,0],y,branch,window):
                        features.append(dict(group=g,scan_rate_V_s=v,branch=branch,treatment=treatment,
                            smoothing_points=window,potential_V=a[k,0],current_A=y[k],
                            smoothed_current_A=ys,prominence_A=p))
            # Track an interior RAW local extremum in fixed exploratory regions.
            # This does not imply these two features belong to one redox couple.
            interval=(-.9,-.2) if branch=='cathodic' else (-.2,.5)
            for window in [11,31,61]:
                options=[r for r in candidates(a[:,0],a[:,2],branch,window) if interval[0]<a[r[0],0]<interval[1]]
                found=bool(options)
                k,p,ys=max(options,key=lambda r:r[1]) if found else (0,0,np.nan)
                chosen.append(dict(group=g,scan_rate_V_s=v,branch=branch,smoothing_points=window,
                    potential_V=a[k,0] if found else np.nan,smoothed_current_A=ys,
                    interior_peak_found=found))
    C=pd.DataFrame(features);P=pd.DataFrame(chosen)
    C.to_csv(out/'candidate_features.csv',index=False);P.to_csv(out/'raw_feature_tracking.csv',index=False)
    slopes=[]
    for (g,b,w),d in P.groupby(['group','branch','smoothing_points']):
        for name,cut in [('all_rates',0),('high_four',.2)]:
            dd=d[(d.scan_rate_V_s>=cut)&d.interior_peak_found].sort_values('scan_rate_V_s')
            if len(dd)<3: continue
            fit=linregress(np.log10(dd.scan_rate_V_s),dd.potential_V)
            slopes.append(dict(group=g,branch=b,smoothing_points=w,selection=name,n=len(dd),
                slope_V_per_decade=fit.slope,intercept_V=fit.intercept,r_squared=fit.rvalue**2,
                all_expected_rates_present=len(dd)==(8 if cut==0 else 4)))
    S=pd.DataFrame(slopes);S.to_csv(out/'peak_shift_diagnostics.csv',index=False)
    summary={'source_archive':'BioNano-reproduction-audit.zip Original/porphyrin',
        'n_traces':len(data),'scan_rates_mV_s':sorted(set(v*1000 for g,v in data)),
        'smoothing_windows_points':[11,31,61], 'kinetic_rate_estimate':None,
        'kinetic_status':'No redox-couple assignment or rate constant is established by automated feature screening.',
        'reasons':['Broad raw features also occur in PBS and bare-gold controls.',
            'Control subtraction changes feature shape, position and polarity.',
            'The archive does not independently establish which oxidation and reduction features are one chemical couple.',
            'Surface confinement versus diffusion, electron number, temperature and uncompensated resistance are not established for these records.'],
        'interior_raw_features_31_points':P[P.smoothing_points==31].groupby(['group','branch']).interior_peak_found.sum().reset_index().to_dict('records'),
        'high_four_slopes_31_points':S[(S.selection=='high_four')&(S.smoothing_points==31)].to_dict('records')}
    (out/'summary.json').write_text(json.dumps(summary,indent=2))
    plt.rcParams.update({'font.size':9,'axes.spines.top':False,'axes.spines.right':False})
    fig,axes=plt.subplots(2,2,figsize=(9,6.7))
    colors={'PBS':'#777777','AuNPs':'#9a7129','Por':'#b45b39','AuNPs+Por':'#236a94'}
    for g in colors:
        for branch in ['cathodic','anodic']:
            a=data[g,.1][branch];axes[0,0].plot(a[:,0],a[:,2]*1e9,color=colors[g],label=g if branch=='cathodic' else None)
        for branch,axis in [('cathodic',axes[1,0]),('anodic',axes[1,1])]:
            dd=P[(P.group==g)&(P.branch==branch)&(P.smoothing_points==31)].sort_values('scan_rate_V_s')
            axis.semilogx(dd.scan_rate_V_s*1000,dd.potential_V,'o',color=colors[g],label=g,ms=3)
    for treatment,col in [('raw','#236a94'),('minus_PBS','#b45b39'),('minus_AuNPs','#9a7129')]:
        for branch in ['cathodic','anodic']:
            x,y=processed['AuNPs+Por',.1,branch,treatment]
            axes[0,1].plot(x,y*1e9,color=col,label=treatment.replace('_',' ') if branch=='cathodic' else None)
    axes[0,0].set(title='A  Full CVs at 100 mV/s',xlabel='Applied potential (V)',ylabel='Current (nA)');axes[0,0].legend(fontsize=7)
    axes[0,1].set(title='B  Sensitivity to matched controls',xlabel='Applied potential (V)',ylabel='Current (nA)');axes[0,1].legend(fontsize=7)
    axes[1,0].set(title='C  Selected cathodic local extrema',xlabel='Scan rate (mV/s)',ylabel='Feature potential (V)')
    axes[1,1].set(title='D  Selected anodic local extrema',xlabel='Scan rate (mV/s)',ylabel='Feature potential (V)');axes[1,1].legend(fontsize=7)
    fig.tight_layout();fig.savefig(out/'figure7_cv_peak_screening.png',dpi=240);fig.savefig(out/'figure7_cv_peak_screening.svg');plt.close(fig)
    print(json.dumps(summary,indent=2))


if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--source',type=Path,default=Path('source'));parser.add_argument('--output',type=Path,default=Path('outputs'))
    args=parser.parse_args();run(args.source,args.output)
