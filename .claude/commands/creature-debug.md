# Creature Debug

Debug a specific creature's behavior. User provides creature ID and describes the issue.

**Usage:** `/creature-debug <creature_id>` then describe the problem

## API Endpoints Reference

### Creature APIs
```bash
# Get creature info (latest generation)
GET /api/creatures/{creature_id}

# Get creature info for specific generation
GET /api/creatures/{creature_id}?generation={gen}

# Get creature frames for replay
GET /api/creatures/{creature_id}/frames
GET /api/creatures/{creature_id}/frames?generation={gen}
GET /api/creatures/{creature_id}/frames?best=true  # Best fitness generation

# Get creature ancestors
GET /api/creatures/{creature_id}/ancestors

# Get best creature for run
GET /api/creatures/run/{run_id}/best

# Get longest survivor for run
GET /api/creatures/run/{run_id}/longest-survivor
```

### Run & Generation APIs
```bash
# Get run info with config
GET /api/runs/{run_id}

# List all generations
GET /api/runs/{run_id}/generations

# Get generation metadata
GET /api/runs/{run_id}/generations/{gen}

# Get all creatures for a generation
GET /api/runs/{run_id}/generations/{gen}/creatures
```

### Evolution API
```bash
# Run evolution step - returns new generation + culled_ids
POST /api/evolution/{run_id}/step

# Response includes:
# - creatures: array of creatures in new generation
# - culled_ids: array of creature IDs that died (based on selection method)
#   This varies by selection method:
#   - truncation: bottom N% by fitness
#   - tournament: losers of tournament rounds
#   - speciation: culled per-species based on adjusted fitness
```

## Step 1: Fetch Creature Data

```bash
# Get creature info with genome
curl -s http://localhost:8000/api/creatures/{creature_id} | python -m json.tool

# Get frames AND activations for replay analysis
curl -s http://localhost:8000/api/creatures/{creature_id}/frames
# Returns: { frames, activations_per_frame, ... }
```

## Step 2: Extract Key Info

From the creature response, check:

```python
# Genome structure
genome['nodes']        # Body structure
genome['muscles']      # Connections + params (amplitude, frequency, phase, strength)
genome['neuralGenome'] # Weights and biases

# Performance
fitness, pellets_collected, disqualified, disqualified_reason

# Identity
survival_streak, birth_generation, death_generation
```

## Step 3: Diagnose by Symptom

### "Outputs oscillating but creature not moving"
- **Pure mode**: Outputs map directly to contraction. Check muscle strength, node constraints
- **Hybrid mode**: Check `muscle.amplitude` - if low (0.05), even ±1.0 output = tiny movement

### "Muscles not responding to neural output"
- Check `config.use_neural_net` is True
- Check `neuralGenome` exists
- Check `outputBiases` - very negative (< -2) makes activation hard
- Check `hiddenBiases` - very negative = dead hidden layer

### "Creature vibrating/jittering"
- Check `muscle.frequency` - high freq (> 3.0) causes vibration
- NN outputs cached for 4 physics steps - rapid changes cause jitter

### "Not collecting pellets despite movement"
- Check if moving TOWARD pellet (sensor inputs show direction)
- Check `disqualified` and `disqualified_reason`

### "Wildly oscillating outputs"
- Check input weights magnitude - very large = saturated activations
- Check if creature is spinning/tumbling (velocity inputs changing rapidly)

## Key Formulas

```python
# Neural output → muscle contraction
# Pure mode:   contraction = nn_output  (direct, -1 to 1, NO amplitude)
# Hybrid mode:
#   base_contraction = sin(time * freq * 2π + phase)
#   nn_modulation = 0.5 + (nn_output + 1) * 0.5  # Maps [-1,1] to [0.5, 1.5]
#   contraction = base_contraction * amplitude * nn_modulation

# Contraction → rest length
rest_length = base_rest_length * (1 - contraction)
# contraction=1.0  → rest_length=0.01 (clamped min)
# contraction=0.0  → rest_length=base (neutral)
# contraction=-1.0 → rest_length=2*base (extended)
```

## Quick Analysis Script

```python
import numpy as np

def analyze_neural(genome):
    ng = genome.get('neuralGenome', {})
    if not ng:
        print("No neural genome!")
        return

    iw = np.array(ng['inputWeights'])
    ow = np.array(ng['outputWeights'])
    hb = np.array(ng['hiddenBiases'])
    ob = np.array(ng['outputBiases'])

    print(f"Input weights:  mean={iw.mean():.3f}, std={iw.std():.3f}, max={np.abs(iw).max():.3f}")
    print(f"Output weights: mean={ow.mean():.3f}, std={ow.std():.3f}, max={np.abs(ow).max():.3f}")
    print(f"Hidden biases:  {hb}")
    print(f"Output biases:  {ob}")

    # Check for dead outputs
    for i, (row, bias) in enumerate(zip(ow, ob)):
        max_act = np.sum(np.abs(row)) + bias
        min_act = -np.sum(np.abs(row)) + bias
        if max_act < 0 or min_act > 0:
            print(f"WARNING: Output {i} likely stuck in range [{min_act:.2f}, {max_act:.2f}]")

def analyze_muscles(genome):
    for i, m in enumerate(genome['muscles']):
        print(f"Muscle {m['nodeA']}-{m['nodeB']}: amp={m['amplitude']:.2f}, freq={m['frequency']:.2f}, str={m['strength']:.2f}")
```

## Run Config Check

Also fetch run config to understand neural settings:
```bash
curl -s http://localhost:8000/api/runs/{run_id} | python -c "
import json, sys
c = json.load(sys.stdin)['config']
print(f'Neural: {c.get(\"use_neural_net\")}, Mode: {c.get(\"neural_mode\")}')
print(f'Hidden: {c.get(\"neural_hidden_size\")}, Bias: {c.get(\"neural_output_bias\")}')
print(f'Time encoding: {c.get(\"time_encoding\", \"none\")}')
print(f'Dead zone: {c.get(\"neural_dead_zone\", 0)}')
"
```

## Activation Analysis (via API)

Query activations over time to check if outputs are actually changing:
```bash
curl -s "http://localhost:8000/api/creatures/{creature_id}/frames" | python -c "
import json, sys
import numpy as np

data = json.load(sys.stdin)
activations = data.get('activations_per_frame', [])

if not activations:
    print('No activations stored!')
    sys.exit(0)

print(f'Total frames: {len(activations)}')

# Show first and last frames
print('\n=== First frame ===')
act = activations[0]
print(f'Inputs:  {[round(x, 3) for x in act.get(\"inputs\", [])]}')
print(f'Hidden:  {[round(x, 3) for x in act.get(\"hidden\", [])]}')
print(f'Outputs: {[round(x, 3) for x in act.get(\"outputs\", [])[:8]]}')

print('\n=== Last frame ===')
act = activations[-1]
print(f'Inputs:  {[round(x, 3) for x in act.get(\"inputs\", [])]}')
print(f'Hidden:  {[round(x, 3) for x in act.get(\"hidden\", [])]}')
print(f'Outputs: {[round(x, 3) for x in act.get(\"outputs\", [])[:8]]}')

# Output statistics
print('\n=== Output statistics ===')
all_outputs = np.array([a.get('outputs', []) for a in activations])
for i in range(min(8, all_outputs.shape[1])):
    col = all_outputs[:, i]
    if col.std() > 0.001:  # Skip constant/padded outputs
        print(f'Output {i}: min={col.min():.3f}, max={col.max():.3f}, std={col.std():.3f}')
"
```

### "Outputs not changing" diagnosis
If outputs have very low std (< 0.01), check:
- **Hidden biases too negative**: All hidden neurons dead
- **Input weights too small**: Inputs not affecting network
- **Output biases too negative**: Outputs stuck near -1

## Data Integrity Debugging

When API responses don't match expected data, query the database directly:

### Check creature performance history
```bash
cd backend && python -c "
import asyncio
from sqlalchemy import text
from app.core.database import async_session_maker

async def check():
    async with async_session_maker() as db:
        result = await db.execute(text('''
            SELECT creature_id, generation, fitness
            FROM creature_performances
            WHERE creature_id = '{creature_id}'
            ORDER BY generation DESC
        '''))
        print('Performance history:')
        for row in result.fetchall():
            print(f'  Gen {row[1]}: fitness {row[2]:.2f}')

asyncio.run(check())
"
```

### Check creature metadata
```bash
cd backend && python -c "
import asyncio
from sqlalchemy import text
from app.core.database import async_session_maker

async def check():
    async with async_session_maker() as db:
        result = await db.execute(text('''
            SELECT id, survival_streak, birth_generation, death_generation, is_elite
            FROM creatures
            WHERE id = '{creature_id}'
        '''))
        row = result.fetchone()
        if row:
            print(f'Creature: {row[0]}')
            print(f'  survival_streak: {row[1]}')
            print(f'  birth_generation: {row[2]}')
            print(f'  death_generation: {row[3]}')
            print(f'  is_elite: {row[4]}')
        else:
            print('Creature not found!')

asyncio.run(check())
"
```

### Check if creature appears in generation
```bash
cd backend && python -c "
import asyncio
from sqlalchemy import text
from app.core.database import async_session_maker

async def check():
    async with async_session_maker() as db:
        result = await db.execute(text('''
            SELECT cp.creature_id, cp.fitness, c.survival_streak
            FROM creature_performances cp
            JOIN creatures c ON c.id = cp.creature_id
            WHERE cp.run_id = '{run_id}' AND cp.generation = {gen}
            ORDER BY cp.fitness DESC
        '''))
        rows = result.fetchall()
        print(f'Gen {gen} creatures ({len(rows)} total):')
        for i, row in enumerate(rows[:20]):
            marker = ' <-- TARGET' if row[0] == '{creature_id}' else ''
            print(f'  {i+1}. {row[0]}: fitness {row[1]:.2f}, streak {row[2]}{marker}')

        # Check if target is lower in the list
        target_found = any(row[0] == '{creature_id}' for row in rows)
        if not target_found:
            print(f'\\n{creature_id} NOT in this generation!')

asyncio.run(check())
"
```

### Check longest survivor data integrity
```bash
cd backend && python -c "
import asyncio
from sqlalchemy import text
from app.core.database import async_session_maker

async def check():
    async with async_session_maker() as db:
        # Get longest survivor
        result = await db.execute(text('''
            SELECT c.id, c.survival_streak, c.birth_generation, c.death_generation,
                   (SELECT MAX(generation) FROM creature_performances WHERE creature_id = c.id) as last_perf_gen,
                   (SELECT fitness FROM creature_performances WHERE creature_id = c.id ORDER BY generation DESC LIMIT 1) as last_fitness
            FROM creatures c
            WHERE c.run_id = '{run_id}'
            ORDER BY c.survival_streak DESC
            LIMIT 1
        '''))
        row = result.fetchone()
        if row:
            print(f'Longest survivor: {row[0]}')
            print(f'  survival_streak: {row[1]}')
            print(f'  birth_generation: {row[2]}')
            print(f'  death_generation: {row[3]}')
            print(f'  last_performance_gen: {row[4]}')
            print(f'  last_fitness: {row[5]:.2f}')
        else:
            print('No creatures found!')

asyncio.run(check())
"
```

### Check generation creature count
```bash
cd backend && python -c "
import asyncio
from sqlalchemy import text
from app.core.database import async_session_maker

async def check():
    async with async_session_maker() as db:
        result = await db.execute(text('''
            SELECT generation, COUNT(*) as count
            FROM creature_performances
            WHERE run_id = '{run_id}'
            GROUP BY generation
            ORDER BY generation DESC
            LIMIT 10
        '''))
        print('Recent generations:')
        for row in result.fetchall():
            print(f'  Gen {row[0]}: {row[1]} creatures')

asyncio.run(check())
"
```
