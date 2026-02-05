# Article Instructions: "me and claude increased the iq of blobs using genetic algorithms"

## Title Options (lowercase, human)

1. **"me and claude increased the iq of blobs using genetic algorithms"** (current favorite)
2. "i simulated evolution with claude code"
3. "teaching blobs to walk: a genetic algorithm journey"
4. "from flailing to walking: how i built an evolution simulator"
5. "i spent 2 weeks evolving ai creatures. here's what surprised me."
6. "what i learned about genetic algorithms by building them from scratch"
7. "building carkh's evolution simulator with claude code"

---

## Motivation & Framing

**The true motivation**: Inspired by Carkh's YouTube series (https://www.youtube.com/watch?v=LMQoLtBJcl8&list=PLrUdxfaFpuuK0rj55Rhc187Tn9vvxck7t&index=17). Wanted to try what he did with NEAT and more proprioception, rebuild it from scratch.

**NOT highfalutin language**. This is a personal journey, not an academic paper. Use conversational, down-to-earth language.

**Reference math and papers** - cite actual research, show equations where relevant, but explain them simply.

**Mistakes I made** - directly reference misinterpretations of papers, bugs caused by not reading the NEAT paper first, etc.

**Honest about Claude collaboration** - this was built with Claude Code, say so candidly. But also emphasize that knowing theory helps - Claude can't replace domain knowledge.

---

## Goals & Tone

- **Show ability to iterate and learn by doing** - the journey matters more than the destination
- **Be personable, talk about struggles** - bugs, frustrations, dead ends
- **Sound human (not highfalutin language)** - no "I learned more about AI by not using gradients than I did in months of reading papers"
- **Be concise** - ~3000-4000 words
- **Come off as legit** - reference papers, show code, talk about issues resolved
- **Candidly mention collaboration with Claude** - built with Claude Code
- **Emphasize that nuance matters** - knowing the theory behind NEAT would have saved 10x time

---

## Writing Style Reference

Match the style from tied-embeddings and claude-code articles:
- Conversational yet technical
- Personal and opinionated (heavy first-person)
- Casual but credible
- Direct and honest about tradeoffs
- Pragmatic over prescriptive
- Use QuoteBox, InsightBox, Aside components
- Include code blocks and math formulas
- Screenshots and GIFs throughout

---

## Article Structure

### 1. Hook/Intro
- Show the end result: GIF of creatures walking toward pellets
- Brief context: What is Evolution Lab, link to Carkh's video as inspiration
- Why I built it: wanted to understand genetic algorithms by building from scratch, not just reading papers
- [ADD GIF: Best evolved creature collecting pellets]

### 2. The Journey (chronological, with pain points)

#### 2.1. Starting Simple: Oscillatory Creatures (no neural networks)
- Just sinusoidal muscle contractions, no brains
- Creatures were going crazy, winning by flailing limbs
- **Bug**: No frequency constraints → chaotic behavior
- **Fix**: Max frequency clamping (commit `9878dda`)
- [ADD VIDEO: Early chaotic creatures from Desktop]
- Code example: frequency clamping

#### 2.2. Adding a Brain (Neural Networks)
- Added NNs but performance didn't improve at all
- Debugging conversation with Claude:
  - Xavier initialization is wrong for genetic algorithms
  - Time phase input was adding noise, not rhythm
  - Zero biases make "default off" impossible
- **The bootstrap problem**: -1.5 bias requires MULTIPLE weights to coordinate, but evolution changes one at a time
- **Fix**: Negative output biases (-0.5), dead zone threshold, uniform weights
- Reference the Claude conversation from my logs about this
- [ADD SCREENSHOT: First time seeing 160+ generation improvement]
- [ADD SCREENSHOT: Screenshot 2026-01-20 at 13.29.21.png]
- [ADD SCREENSHOT: Screenshot 2026-01-20 at 14.25.12.png]
- Code example: bias initialization change
- **Key commit**: `f4c63b9` - optimize NN for GA

#### 2.3. The Diversity Problem
- Everything converged to the same local optimum
- Learned about:
  - Fitness sharing (Goldberg & Richardson, 1987)
  - Speciation (NEAT paper)
  - Tournament selection
- Implemented speciation as a selection method
- [Link to NEAT paper for speciation]

#### 2.4. NEAT: Variable Topology Networks (the hardest part)
- Decided to let the network structure evolve too
- **This was the hardest part - bugs everywhere**:
  - Cycles forming in the network (A→B→A) - commit `e28f706`
  - Invalid connections after crossover (output neurons as sources) - commit `9b5ff50`
  - Wrong output being removed when muscles mutated - commit `9a28945`
  - Hidden nodes at wrong depth in visualization - commit `c93b8b1`
  - Topological sort failing with bias neurons - commit in CHANGELOG
  - Clones not getting mutated (50% of population wasn't evolving!) - commit `849cb4e`
  - Structural mutations 10x slower than NEAT standard - commit `43e02d3`
- **Key learning**: Reading the NEAT paper (Stanley & Miikkulainen, 2002) FIRST would have saved 10x time
- I was misinterpreting how innovation numbers work, how crossover should happen, what rates were standard
- The `/integration-stress-test` command was a lifesaver - caught bugs nothing else did
- [Link to integration-stress-test gist: [TO ADD LINK]]
- [Brief primer on NEAT with innovation scores - link to paper]
- Code example: Cycle detection (from neat_network.py)

**Include Neural Network Diagram here**:
- Full picture of fully connected network
- All proprioception inputs labeled:
  - Base 7: pellet_dir(3), velocity_dir(3), distance(1)
  - Time encoding: +0-2
  - Strain: +15 (1 per muscle)
  - Velocity: +24 (3 per node)
  - Ground: +8 (1 per node)
  - Total: up to 54 inputs
- Hidden layer (8-32 neurons)
- Outputs (N muscles)
- [ADD DIAGRAM: Neural network architecture]

#### 2.5. PyTorch Backend Migration
- Moved physics from frontend JS to PyTorch tensors
- Why PyTorch for non-gradient work? **Tensor batching**
- Simulating 1000 creatures simultaneously with the same code
- Key operations: `torch.gather`, `scatter_add_` for efficient indexing
- Parity testing: 88 tests ensuring TS and Python behave identically
- [Brief primer: Why PyTorch for non-gradient work - link elsewhere]
- Code example: Batched spring forces (from physics.py)

#### 2.6. NAS: Finding the Best Configuration
- Used Optuna for hyperparameter search
- 100 NEAT trials, 200 Pure GA trials
- **Best Pure GA: 798.6 fitness**
- **Best NEAT: 441.17 fitness**
- Simple fixed topology beat variable topology for this task (!!)

**Counterintuitive findings**:
- Crossover **hurts** performance (r = -0.47) - best trials had `use_crossover: False`
- Time encoding **hurts** performance
- Proprioception **hurts** performance (more inputs = higher dimensional search space = harder to optimize)
- Full initial connectivity dominates (100% of top 10 performers)
- These need more exploration - see genetics-prd.json for future work

[ADD CHART: Parameter correlations from NAS]

#### 2.7. Compute & Parallelization
- How long trials take: ~11 minutes per trial on CPU
- 100 trials = 19 hours sequential
- **Tried to parallelize on 128-core Azure machine - complete failure**:
  - Optuna's joblib backend doesn't work with long-running trials (10+ min)
  - Thread oversubscription: 3 workers × 64 PyTorch threads = 192 threads vs 128 cores
  - 48,000 context switches/second, escalating overhead
- **The breakthrough** (commit `1943ee8`): Optuna's joblib is the problem, use multiprocessing.Pool directly
- **The fix** (commit `6e824a1`): Environment variables must be set INSIDE worker BEFORE importing PyTorch
- Cost analysis: $3.80 for 100 trials sequential vs $28 wasted on failed parallel attempt
- [Reference: RESEARCH_SUMMARY.md, PARALLEL_RESULTS.md, DEFINITIVE_FINDINGS.md]

### 3. Key Learnings (shorter, integrated)

#### 3.1. Theory Matters (Even with AI Assistants)
- Claude is incredibly helpful but can't replace domain knowledge
- Reading the NEAT paper would have prevented 5+ major bugs
- I was misinterpreting:
  - Innovation numbers (how they track historical origin of genes)
  - Standard mutation rates (50%/20% not 5%/3%)
  - Crossover alignment (by innovation ID, not by index)
- The collaboration works best when you know enough to guide it

#### 3.2. Integration Testing is Gold
- The `/integration-stress-test` command caught bugs nothing else did
- 600+ backend tests, 312 frontend tests
- Parity tests between TS and Python were crucial
- 52 edge case tests from integration stress testing alone

### 4. Closing (not professional, personal)
- What's next: things from genetics-prd.json
  - Energy system (metabolic cost)
  - Multi-layer hidden networks
  - More exploration of counterintuitive NAS results
- Final GIF of best creature
- Links to repo, code, notebooks

---

## References to Include (bottom of article)

### Papers
1. **NEAT (2002)** - Stanley & Miikkulainen, "Evolving Neural Networks through Augmenting Topologies"
   - https://nn.cs.utexas.edu/downloads/papers/stanley.ec02.pdf
2. **HyperNEAT (2009)** - Stanley et al.
   - http://eplex.cs.ucf.edu/papers/stanley_alife09.pdf
3. **Novelty Search (2011)** - Lehman & Stanley
   - https://eplex.cs.ucf.edu/papers/lehman_ecj11.pdf
4. **SBX Crossover (1995)** - Deb & Agrawal
5. **Fitness Sharing (1987)** - Goldberg & Richardson

### Resources
- Carkh's Evolution Simulator: https://www.youtube.com/watch?v=LMQoLtBJcl8&list=PLrUdxfaFpuuK0rj55Rhc187Tn9vvxck7t
- NEAT-Python: https://neat-python.readthedocs.io/
- MarI/O NEAT Demo: https://www.youtube.com/watch?v=qv6UVOQ0F44
- Evolution Lab repo: [TO ADD LINK]
- Integration stress test gist: [TO ADD LINK]

---

## Key Commits to Reference (with GitHub links)

### Architecture Milestones
- `1124e57` - First simulation (Cannon-ES)
- `be5b21b` - Neuroevolution system
- `8be2316` - Next.js migration
- `f6679ad` - PyTorch backend (285 tests)
- `6023604` - NEAT schemas
- `8807da4` - NAS/Optuna

### Critical Bug Fixes
- `3bde5ec` - Stable radius for fitness (radius oscillation bug)
- `0f7f946` - Progress banking (losing 60 points on collection!)
- `e28f706` - NEAT cycle prevention
- `6715202` - Minimum mass physics (creatures exploding)
- `6e824a1` - Thread oversubscription fix (4.9x speedup)
- `f4c63b9` - Optimize NN for GA (negative biases, dead zone)
- `9324dec` - Weight mutation magnitude for high-dim stability
- `849cb4e` - NEAT clones not getting mutated
- `43e02d3` - NEAT mutation rates 10x too slow

### Key Learnings
- `9324dec` - High-dim mutation magnitude
- `1943ee8` - Optuna/joblib breakthrough
- `ae3770e` - Mutation after crossover per standard GA flow

---

## Code Examples to Include

1. **Bias initialization** (backend/app/neural/network.py:417-428)
2. **Dead zone threshold** (backend/app/neural/network.py:259-296)
3. **Cycle detection** (backend/app/neural/neat_network.py:794-842)
4. **Batched spring forces** (backend/app/simulation/physics.py:38-126)
5. **Fitness calculation** (backend/app/simulation/fitness.py:754-857)

---

## Assets to Add (User provides)

- [ ] GIF of best evolved creature collecting pellets
- [ ] Video of early chaotic creatures
- [ ] Screenshot of 160+ generation run
- [ ] Screenshots from Desktop (Screenshot 2026-01-20 at 13.29.21.png, etc.)
- [ ] NAS parameter correlation chart
- [ ] Neural network architecture diagram
- [ ] Screenshot 2026-01-29 at 15.58.54.png (compute/parallelism)

---

## Files to Create

1. `/app/genetic-algorithm/layout.tsx` - Metadata
2. `/app/genetic-algorithm/page.tsx` - Main article content

---

## Do NOT Do

- Use highfalutin language ("I learned more about AI by not using gradients than I did in months of reading papers")
- Make it sound like an academic paper
- Skip the struggles and only show the wins
- Forget to reference actual commits and code
- Make the key learnings section too long (integrate into journey sections)
- Make the closing professional/formal
