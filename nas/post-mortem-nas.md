# NAS Post-Mortem Analysis Plan

After running hyperparameter search, use this guide to analyze results.

## Pipeline Overview

```
1. Population Scaling Test (notebook)  →  Find efficient pop size
2. Hyperparameter Search              →  Find best params + early stopping
3. Post-Mortem Analysis (notebook)    →  Deep dive into results
4. Champion Runs (via frontend)       →  Run best params to get replays
```

## Optimization Dimensions

**Single-objective (default):**
- `best_fitness` - Maximum fitness achieved

**Multi-objective (--multi-objective):**
- `best_fitness` - Maximum fitness achieved (exploitation)
- `avg_fitness` - Population average fitness (population learning quality)

High best + low avg = Elite dominance, population not learning
High best + high avg = Whole population evolving well (ideal)

## Step 1: Population Scaling Test

Run Section 10 in `backend/notebooks/neat_plateau_analysis.ipynb`

**Goal:** Find minimum viable population that doesn't lose signal.

**Outputs:**
- Scaling law: `fitness ∝ population^slope`
- Efficient population for search phase
- Recommended population for champion runs

## Step 2: Full Search Command

```bash
cd nas && python cli.py search neat-full \
    --mode neat \
    --trials 50 \
    --generations 150 \
    --seeds 3 \
    --population-size 200 \
    --stagnation-limit 50 \
    --device cpu
```

**What happens:**
1. Runs 50 trials with different hyperparameters
2. Each trial: up to 150 generations × 3 seeds × 200 population
3. Early stopping: trial stops if no improvement for 50 generations
4. Prints best params
5. All results saved to JSON files

## Step 3: Results Location

After search completes, find results in:
```
results/search_<study-name>_<timestamp>/
├── summary.json         # Search metadata + best params
└── trial_XXXX.json      # Per-trial results
```

## Step 4: Post-Mortem Notebook

Create `backend/notebooks/nas_postmortem.ipynb` with the following analyses:

### a) Load Results
```python
import json
from pathlib import Path

results_dir = Path("../../nas/results/search_neat-full_XXXXXX")
summary = json.load(open(results_dir / "summary.json"))

# Load all trial results
trials = []
for f in sorted(results_dir.glob("trial_*.json")):
    trials.append(json.load(open(f)))

# Get best params
best_params = summary.get('best_params', {})
```

### b) Parameter Importance Analysis

1. **What parameters matter most?**
   - Rank parameters by variance in fitness they explain
   - Create parallel coordinates plot (params vs fitness)
   - Parameter correlation heatmap

2. **Top 5 most impactful parameters**
   - Show distribution of values for top vs bottom 10 trials

### c) Proprioception Analysis

- Compare trials with `use_proprioception=True` vs `False`
- Which `proprioception_inputs` mode works best? (all, strain, velocity, ground)
- Box plots of fitness by proprioception config

### d) Network Topology Patterns

- Optimal `neat_max_hidden_nodes`
- Best `neat_initial_connectivity` mode
- Add node vs add connection rate sweet spots
- Scatter: hidden nodes vs fitness (is bigger better?)

### e) NEAT-Specific Settings

- Optimal `compatibility_threshold`
- Impact of distance coefficients (excess, disjoint, weight)
- Speciation dynamics: how many species in best runs?

### f) Time Encoding Analysis

- Compare fitness across `time_encoding` modes (none, cyclic, sin, raw, sin_raw)
- Does adding time input help NEAT?

### g) Trial Rankings

```python
import pandas as pd

# Convert to DataFrame for easy analysis
df = pd.DataFrame([{
    'trial': t['trial_number'],
    'mean_best': t['mean_best_fitness'],
    'mean_avg': t['mean_avg_fitness'],
    **t['params']
} for t in trials])

# Top trials by BEST fitness (exploitation)
print("Top 10 Trials by Best Fitness:")
print(df.nlargest(10, 'mean_best')[['trial', 'mean_best', 'mean_avg']])

# Top trials by AVERAGE fitness (population learning)
print("\nTop 10 Trials by Average Fitness:")
print(df.nlargest(10, 'mean_avg')[['trial', 'mean_best', 'mean_avg']])

# Best "balanced" trials (high best AND high avg)
df['combined_score'] = df['mean_best'] + df['mean_avg']
print("\nTop 10 Balanced Trials (best + avg):")
print(df.nlargest(10, 'combined_score')[['trial', 'mean_best', 'mean_avg', 'combined_score']])

# Efficiency: high avg relative to best (population is learning, not just elite)
df['learning_ratio'] = df['mean_avg'] / df['mean_best']
print("\nTop 10 by Learning Ratio (avg/best):")
print(df.nlargest(10, 'learning_ratio')[['trial', 'mean_best', 'mean_avg', 'learning_ratio']])
```

---

## Step 5: Generate Champion Run Command

The notebook should output a command to run the best hyperparameters in the frontend, which stores results to PostgreSQL for visualization and replay.

### g) Output Frontend Command

```python
# Generate URL with best params pre-filled
import urllib.parse

base_url = "http://localhost:3001/menu"
params = {
    'neural_mode': 'neat',
    'population_size': 500,  # Higher for champion run
    **best_params  # Spread best hyperparameters
}

# Print summary of best params
print("Best Hyperparameters Found:")
print("-" * 40)
for k, v in sorted(best_params.items()):
    print(f"  {k}: {v}")
print()

# Generate the config JSON for manual input
config_json = json.dumps(params, indent=2)
print("Configuration JSON (paste into browser console):")
print(config_json)
print()

# Alternative: generate curl command to create run via API
api_params = {
    "name": "NAS Champion Run",
    "config": params,
}
print("Or create run via API:")
print(f"curl -X POST http://localhost:8000/api/runs \\")
print(f"  -H 'Content-Type: application/json' \\")
print(f"  -d '{json.dumps(api_params)}'")
```

---

## INTERESTING CREATURE ANALYSES (after running champions in frontend)

Query creatures from PostgreSQL after running champion configuration:

```python
import psycopg2
import pandas as pd

# Connect to postgres and load champion run creatures
conn = psycopg2.connect("postgresql://user:pass@localhost/evolution_lab")
creatures_df = pd.read_sql("""
    SELECT c.*, g.genome, g.neat_genome
    FROM creatures c
    JOIN genomes g ON c.genome_id = g.id
    WHERE c.run_id = '<champion_run_id>'
    ORDER BY c.fitness DESC
""", conn)

# Extract genome metrics
creatures_df['num_nodes'] = creatures_df['genome'].apply(lambda g: len(g.get('nodes', [])))
creatures_df['num_muscles'] = creatures_df['genome'].apply(lambda g: len(g.get('muscles', [])))
creatures_df['num_hidden'] = creatures_df['neat_genome'].apply(
    lambda g: len([n for n in g.get('nodes', []) if n['type'] == 'hidden']) if g else 0
)
creatures_df['num_connections'] = creatures_df['neat_genome'].apply(
    lambda g: len([c for c in g.get('connections', []) if c['enabled']]) if g else 0
)
```

### i) Most Unique Creatures

Find creatures with unusual but successful strategies (high-fitness outliers):

```python
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import DBSCAN
import numpy as np

# Features for clustering: body shape + brain topology
features = creatures_df[['num_nodes', 'num_muscles', 'num_hidden', 'num_connections']].values
scaler = StandardScaler()
features_scaled = scaler.fit_transform(features)

# Cluster creatures
clustering = DBSCAN(eps=0.5, min_samples=5).fit(features_scaled)
creatures_df['cluster'] = clustering.labels_

# Find high-fitness outliers (cluster=-1 means outlier)
outliers = creatures_df[creatures_df['cluster'] == -1].copy()
unique_creatures = outliers.nlargest(10, 'fitness')

print("Most Unique High-Fitness Creatures:")
print(unique_creatures[['id', 'fitness', 'num_nodes', 'num_muscles', 'num_hidden', 'cluster']])

# Also find creatures that are outliers WITHIN successful clusters
for cluster_id in creatures_df['cluster'].unique():
    if cluster_id == -1:
        continue
    cluster = creatures_df[creatures_df['cluster'] == cluster_id]
    if len(cluster) > 10:
        top_in_cluster = cluster.nlargest(3, 'fitness')
        print(f"\nTop performers in cluster {cluster_id} (n={len(cluster)}):")
        print(top_in_cluster[['id', 'fitness', 'num_nodes', 'num_muscles']])
```

### j) Most Efficient Creatures (High Fitness / Low Energy)

**Goal:** Find creatures that achieve high fitness with minimum energy expenditure.

```python
# Efficiency = fitness / total_muscle_activation
# Higher efficiency = smarter movement, not just thrashing

creatures_df['efficiency'] = creatures_df['fitness'] / (creatures_df['total_activation'] + 1e-6)

# Top 10 most efficient (high fitness per unit energy)
print("Most Efficient Creatures (fitness/energy):")
efficient = creatures_df[creatures_df['fitness'] > 50].nlargest(10, 'efficiency')
print(efficient[['id', 'fitness', 'total_activation', 'efficiency']])

# Pareto front: maximize fitness, minimize activation
from scipy.spatial import ConvexHull
pareto_candidates = creatures_df[['fitness', 'total_activation']].values
# Invert activation for pareto (we want to minimize it)
pareto_points = np.column_stack([pareto_candidates[:, 0], -pareto_candidates[:, 1]])

# Find pareto-optimal creatures
def is_pareto_optimal(costs):
    is_optimal = np.ones(costs.shape[0], dtype=bool)
    for i, c in enumerate(costs):
        if is_optimal[i]:
            is_optimal[is_optimal] = np.any(costs[is_optimal] > c, axis=1)
            is_optimal[i] = True
    return is_optimal

pareto_mask = is_pareto_optimal(pareto_points)
pareto_creatures = creatures_df[pareto_mask].sort_values('fitness', ascending=False)
print("\nPareto-Optimal Creatures (fitness vs energy tradeoff):")
print(pareto_creatures.head(10)[['id', 'fitness', 'total_activation', 'efficiency']])
```

### k) Smallest Successful Creatures

**Goal:** Find minimal body/brain that still performs well.

```python
# Define "successful" threshold (e.g., fitness > 100)
SUCCESS_THRESHOLD = 100

successful = creatures_df[creatures_df['fitness'] > SUCCESS_THRESHOLD].copy()

# Body complexity = nodes + muscles
successful['body_complexity'] = successful['num_nodes'] + successful['num_muscles']

# Brain complexity = hidden nodes + connections
successful['brain_complexity'] = successful['num_hidden'] + successful['num_connections']

# Total complexity
successful['total_complexity'] = successful['body_complexity'] + successful['brain_complexity']

# Smallest successful body
print("Smallest Successful Bodies (fitness > 100):")
smallest_body = successful.nsmallest(10, 'body_complexity')
print(smallest_body[['id', 'fitness', 'num_nodes', 'num_muscles', 'body_complexity']])

# Smallest successful brain
print("\nSmallest Successful Brains:")
smallest_brain = successful.nsmallest(10, 'brain_complexity')
print(smallest_brain[['id', 'fitness', 'num_hidden', 'num_connections', 'brain_complexity']])

# Overall simplest successful creature
print("\nSimplest Successful Creatures (total complexity):")
simplest = successful.nsmallest(10, 'total_complexity')
print(simplest[['id', 'fitness', 'body_complexity', 'brain_complexity', 'total_complexity']])

# Scatter plot: fitness vs complexity
import matplotlib.pyplot as plt
fig, axes = plt.subplots(1, 3, figsize=(15, 4))

axes[0].scatter(creatures_df['body_complexity'], creatures_df['fitness'], alpha=0.5)
axes[0].set_xlabel('Body Complexity')
axes[0].set_ylabel('Fitness')
axes[0].axhline(SUCCESS_THRESHOLD, color='r', linestyle='--', label='Success threshold')

axes[1].scatter(creatures_df['brain_complexity'], creatures_df['fitness'], alpha=0.5)
axes[1].set_xlabel('Brain Complexity')
axes[1].set_ylabel('Fitness')

axes[2].scatter(creatures_df['total_complexity'], creatures_df['fitness'], alpha=0.5)
axes[2].set_xlabel('Total Complexity')
axes[2].set_ylabel('Fitness')

plt.tight_layout()
plt.savefig('complexity_vs_fitness.png')
```

### l) Highest Average Fitness Runs

Find which parameter configurations led to the best population-wide learning:

```python
# Back to trial-level analysis
# Trials where the WHOLE population learned (high avg, not just elite)

print("Trials with Highest Average Fitness:")
top_avg = df.nlargest(5, 'mean_avg')
for _, row in top_avg.iterrows():
    print(f"\nTrial {row['trial']}: avg={row['mean_avg']:.1f}, best={row['mean_best']:.1f}")
    # Show key params that differ from median
    for param in ['neat_initial_connectivity', 'compatibility_threshold',
                  'neat_add_connection_rate', 'use_proprioception']:
        if param in row:
            print(f"  {param}: {row[param]}")
```

### m) Body Plan Analysis

```python
# What body shapes dominate in top performers?
top_performers = creatures_df.nlargest(100, 'fitness')

fig, axes = plt.subplots(1, 2, figsize=(12, 4))

# Node count distribution
axes[0].hist(top_performers['num_nodes'], bins=range(2, 10), alpha=0.7, label='Top 100')
axes[0].hist(creatures_df['num_nodes'], bins=range(2, 10), alpha=0.3, label='All')
axes[0].set_xlabel('Number of Nodes')
axes[0].set_ylabel('Count')
axes[0].legend()
axes[0].set_title('Body Size Distribution')

# Muscle count distribution
axes[1].hist(top_performers['num_muscles'], bins=range(1, 20), alpha=0.7, label='Top 100')
axes[1].hist(creatures_df['num_muscles'], bins=range(1, 20), alpha=0.3, label='All')
axes[1].set_xlabel('Number of Muscles')
axes[1].legend()
axes[1].set_title('Muscle Count Distribution')

plt.tight_layout()
plt.savefig('body_plan_analysis.png')

# Optimal body size
print("\nMean body metrics for top 100 vs all:")
print(f"  Nodes: {top_performers['num_nodes'].mean():.1f} vs {creatures_df['num_nodes'].mean():.1f}")
print(f"  Muscles: {top_performers['num_muscles'].mean():.1f} vs {creatures_df['num_muscles'].mean():.1f}")
```

### n) Brain Complexity Sweet Spot

```python
# Is there an optimal brain size?
fig, axes = plt.subplots(1, 2, figsize=(12, 4))

# Hidden nodes vs fitness
axes[0].scatter(creatures_df['num_hidden'], creatures_df['fitness'], alpha=0.3)
axes[0].set_xlabel('Hidden Nodes')
axes[0].set_ylabel('Fitness')
axes[0].set_title('Brain Size vs Performance')

# Connections vs fitness
axes[1].scatter(creatures_df['num_connections'], creatures_df['fitness'], alpha=0.3)
axes[1].set_xlabel('Enabled Connections')
axes[1].set_ylabel('Fitness')
axes[1].set_title('Brain Connectivity vs Performance')

plt.tight_layout()
plt.savefig('brain_complexity.png')

# Find the sweet spot
bins = pd.cut(creatures_df['num_hidden'], bins=[0, 5, 10, 15, 20, 30, 50])
print("\nAverage fitness by hidden node count:")
print(creatures_df.groupby(bins)['fitness'].agg(['mean', 'max', 'count']))
```

### o) Replay Visualization

```python
# For top creatures, generate movement visualizations
top_5 = creatures_df.nlargest(5, 'fitness')

for _, creature in top_5.iterrows():
    creature_id = creature['id']

    # Load frames from postgres
    frames = pd.read_sql(f"""
        SELECT frame_number, positions, muscle_activations
        FROM creature_frames
        WHERE creature_id = '{creature_id}'
        ORDER BY frame_number
    """, conn)

    if len(frames) > 0:
        print(f"\nCreature {creature_id} (fitness={creature['fitness']:.1f}):")
        print(f"  Frames: {len(frames)}")
        print(f"  Body: {creature['num_nodes']} nodes, {creature['num_muscles']} muscles")
        print(f"  Brain: {creature['num_hidden']} hidden, {creature['num_connections']} connections")

        # Plot trajectory (center of mass over time)
        # positions is stored as JSON array of node positions per frame
        # Extract and plot CoM trajectory
```

---

## Key Metrics Summary Table

| Metric | Description | Goal |
|--------|-------------|------|
| Best Fitness | Max fitness in trial | Higher |
| Avg Fitness | Population mean | Higher |
| Variance | Fitness spread | Lower |
| Convergence | Gen when best plateaus | Earlier |
| Body Complexity | Nodes + muscles | Moderate |
| Brain Complexity | Hidden nodes + connections | Moderate |
| Efficiency | Fitness / activation | Higher |

---

## Auto-Generate Analysis Notebook

After search completes, run:

```bash
# From project root
claude --print "Create the nas_postmortem.ipynb notebook following \
  nas/post-mortem-nas.md. Results are in nas/results/search_neat-full_XXXXXX/. \
  Load all data, create all visualizations, find interesting creatures, \
  and summarize key findings. Be thorough and insightful."
```

---

## Commands Quick Reference

```bash
# Quick test (verify pipeline works)
nas search quick-test -m neat -n 3 -g 10 -s 1 -p 50 --stagnation-limit 0

# Full search (recommended)
nas search neat-full -m neat -n 50 -g 150 -s 3 -p 200 --stagnation-limit 50

# Fast search (fewer generations, no early stopping)
nas search neat-fast -m neat -n 50 -g 50 -s 2 -p 200 --stagnation-limit 0

# Multi-objective (Pareto front)
nas search neat-pareto -m neat -n 50 -g 150 -s 2 -p 200 --multi-objective --stagnation-limit 50

# List configs
nas configs

# Compare results
nas compare neat_baseline neat_sparse neat_proprio
```
