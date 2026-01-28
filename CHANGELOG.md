# Changelog

All notable changes to the Genetic Algorithm Evolution Simulator.

## [Unreleased]

### Changed
- **Speciation is now a Selection Method**: Replaced `useSpeciation` toggle with `selectionMethod: 'speciation'`
  - Selection dropdown now has 4 options: Rank, Tournament, Truncation, Speciation
  - When NEAT mode enabled, selection is forced to 'speciation' (required for topology evolution)
  - Migration: Old configs with `useSpeciation: true` automatically convert to `selectionMethod: 'speciation'`
  - **Breaking**: Removed `useSpeciation` field from SimulationConfig - use `selectionMethod` instead

### Added
- **Within-Species Breeding**: Speciation selection now breeds parents within the same species
  - Offspring slots allocated proportionally to species average fitness
  - Parents selected using rank-based probabilities within their species
  - Protects structural innovations by keeping similar genomes together during reproduction
  - Proper NEAT implementation: speciation groups → within-species survival → within-species breeding
- **NEAT Initial Connectivity Options**: Configurable starting topology for NEAT networks
  - `full`: All inputs connected to all outputs (standard NEAT, most responsive)
  - `sparse_inputs`: Each input connects to exactly one random output (all sensors used, total = input count)
  - `sparse_outputs`: Each output gets exactly one random input (all muscles active, total = output count)
  - `none`: No initial connections (topology emerges entirely from evolution)
  - UI dropdown in NEAT Topology section when NEAT mode selected
  - Backwards compatible: `sparse` alias maps to `sparse_outputs`
- **NEAT Enable/Disable Connection Rates**: UI sliders for connection enable/disable probabilities
  - `neatEnableRate`: Probability to re-enable a disabled connection (default 2%)
  - `neatDisableRate`: Probability to disable an enabled connection (default 1%)
- **NEAT Connectivity Mode Tests**: 33 comprehensive tests in `test_neat_connectivity_modes.py`
  - Tests for all connectivity modes (full, sparse_inputs, sparse_outputs, none)
  - Tests for bias_node interaction with each mode
  - Tests for topological sort with all modes
  - Tests for forward pass behavior with each mode
  - Edge case tests (single input/output, many inputs/few outputs, etc.)

### Fixed
- **NEAT Structural Mutations Too Slow**: Fixed topology evolution being 10x slower than standard NEAT
  - Bug 1: `elif` made add_node and add_connection mutually exclusive (only one tried per generation)
  - Bug 2: Default rates (5% connection, 3% node) were 10x lower than NEAT standard (50%, 20%)
  - Symptom: After 24 generations with `none` connectivity, most creatures had 0 input connections
  - Fix: Changed `elif` to independent `if` checks; updated defaults to match NEAT-python (50%/20%)
  - Reference: NEAT-python uses `conn_add_prob=0.5`, `node_add_prob=0.2` with independent application
- **NEAT Clones Not Getting Mutated**: Fixed NEAT topologies not evolving when `useMutation=false`
  - Bug: Clone offspring (50% of population with default crossover rate) never got NEAT structural mutations
  - Root cause: `should_mutate = do_crossover or use_mutation` excluded clones when `use_mutation=False`
  - Symptom: After 51 generations, creatures had 0 input connections - only bias-to-output connections
  - Fix: Changed to `should_mutate = config.use_neat or do_crossover or use_mutation`
  - NEAT mode now always applies mutations to enable topology evolution
- **Velocity Sensor Oscillation**: Fixed velocity inputs oscillating ±1 for nearly stationary creatures
  - Bug: Velocity was normalized to unit vector - tiny physics jitter normalized to ±1
  - Root cause: `velocity / magnitude` with threshold 1e-6 still triggered on micro-movements
  - Symptom: vel_x/vel_y inputs had 100+ sign changes per simulation for barely moving creatures
  - Fix: Changed to magnitude-scaled velocity (`velocity / max_velocity`) clamped to [-1, 1]
  - Now stationary creatures get ~0 velocity inputs, moving creatures get proportional signal
- **NEAT Topological Sort with Bias Neurons**: Fixed "Network contains a cycle!" error when using `none` connectivity with `bias_node` mode
  - Bug: Bias neurons were included in topological sort queue but excluded from expected count
  - Fix: Changed queue initialization to exclude bias neurons (same as input neurons)
  - Affected line: `neat_network.py:235` - now checks `n.type not in ('input', 'bias')`
- **NEAT Dead Zone Not Applied**: Fixed NEAT mode ignoring dead zone threshold
  - Bug: Dead zone only applied for `mode == 'pure'`, not for NEAT
  - Symptom: Creatures moved even with `connectivity='none'` because bias output (-0.1) wasn't zeroed
  - Fix: Changed condition to `mode in ('pure', 'neat')` in three places in physics.py
  - Now NEAT mode respects `neural_dead_zone` setting like pure mode
- **Muscle Damping Too Low (Spring-like Behavior)**: Increased default damping from 0.5 to 3.0
  - Bug: Damping ratio ζ ≈ 0.08 caused 10+ second settle times after impacts
  - Symptom: Creatures oscillated/tumbled for entire simulation after falling from spawn
  - Fix: Changed default damping from 0.5 to 3.0 across all files:
    - `genome.py`: Schema default 0.5 → 3.0
    - `tensors.py`: Fallback 0.1 → 3.0
    - `mutation.py`: Range [0.1, 0.5] → [2.0, 4.0], clamp [0.05, 0.8] → [1.0, 6.0]
    - `population.py`: Range [0.05, 0.5] → [2.0, 4.0]
    - `crossover.py`: Default 0.5 → 3.0
    - `services/genetics.py`: Range [0.3, 0.7] → [2.0, 4.0], clamp [0.1, 1.0] → [1.0, 6.0]
  - Result: ζ ≈ 0.5 → settles in ~1-2 seconds (muscle-like behavior)
- **Physics Explosion with Small Nodes**: Added minimum mass constraint of 0.5 kg
  - Bug: Small nodes (size 0.26) had mass only 0.09 kg, creating 2000+ m/s² accelerations
  - Symptom: Creatures would randomly explode/fly apart after settling on ground
  - Root cause: F=ma with large spring forces (~200 N) and tiny masses → unstable Euler integration
  - Fix: Added `max(0.5, ...)` to mass calculation in `tensors.py:183`
  - Result: Max acceleration capped at ~400 m/s² (40× gravity) for typical spring forces

### Added
- **Muscle Velocity Cap**: Physics-level constraint on muscle speed (v2-prd Phase 1)
  - Limits how fast muscles can change length per timestep
  - Default 5.0 units/sec, configurable 0.1-20.0
  - Formula: `max_delta_per_step = velocity_cap * dt`
  - Prevents physically impossible muscle speeds regardless of neural output
- **Output Smoothing**: Exponential smoothing on neural outputs (v2-prd Phase 2)
  - Smooths the TARGET muscles are trying to reach
  - Default alpha=0.3 (30% new + 70% old), configurable 0.05-1.0
  - Formula: `smoothed = alpha * raw + (1 - alpha) * smoothed`
  - Alpha guide: 0.1=very smooth, 0.3=moderate, 0.5=light, 1.0=instant
- **Configurable Neural Update Rate**: Replace hardcoded 4-step cache
  - New `neuralUpdateHz` parameter (default 15, range 5-60)
  - Dynamically calculates interval: `physics_fps / neural_update_hz`
- **Muscle Damping Multiplier**: Global scale for muscle damping (v2-prd Phase 3)
  - Scales per-muscle damping coefficients uniformly
  - Default 1.0 (no change), configurable 0.1-5.0
  - Higher values = more "underwater" feel, less oscillation
- **Max Extension Ratio**: Configurable muscle stretch limits (v2-prd Phase 4)
  - Limits how much muscles can stretch/compress relative to rest length
  - Default 2.0 (muscles can be 50%-200% of rest length), configurable 1.2-5.0
  - Prevents grotesque stretching, keeps creatures looking solid
- **Proprioception Inputs**: Body-sensing inputs for neural networks (Phase 7)
  - Muscle strain: (currentLength - restLength) / restLength per muscle (15 inputs)
  - Node velocities: normalized xyz velocity per node (24 inputs)
  - Ground contact: binary contact per node (8 inputs)
  - Combined "all" mode: 47 additional inputs
  - Configurable via UI toggle and input type selector
  - Dynamic input sizing based on proprioception settings
  - 35 comprehensive edge case tests for numerical stability
- **Time Encoding Options**: Configurable time input for neural networks
  - `none`: 7 inputs (no time) - default for pure mode
  - `sin`: 8 inputs (sin(2πt)) - rhythmic timing
  - `raw`: 8 inputs (t/maxTime) - linear progress 0→1
  - `cyclic`: 9 inputs (sin + cos) - unique position in cycle, default for hybrid mode
  - `sin_raw`: 9 inputs (sin + raw) - combines rhythm with progress awareness
  - Menu dropdown to select encoding, auto-switches when toggling pure/hybrid mode

### Fixed
- **Fitness Progress Banking**: Fixed pellet collection causing fitness to DROP instead of increase
  - Before: Collecting pellet reset progress to 0 (fitness 80 → 20)
  - After: Each pellet banks full 100 pts (80 progress + 20 bonus)
  - See `docs/FITNESS.md` for detailed fitness system documentation
- **Fitness Radius Consistency**: Fixed false regression penalties when creature stayed still
  - `update_pellets` and `calculate_fitness` now use same stable creature radius
  - Prevents muscle oscillation from triggering phantom regression
- **Best/Longest Survivor Replay**: Fixed replay showing death generation instead of best performance
  - Added dedicated API endpoints for best creature and longest survivor
  - Frames now load from generation with highest fitness
- **Ground Friction Physics**: Changed from broken velocity damping to proper Coulomb friction model
  - Before: Multiplicative damping (98.8% velocity loss/sec) killed all motion
  - After: Force-based friction that can be overcome by muscle forces
  - Creatures can now actually push against the ground and move
- **NN Update Jitter**: Added `nn_update_interval` (default 4) to reduce jitter
  - NN outputs cached and reused between updates (15 updates/sec instead of 60)
  - Smoother creature movement in neural modes
- **Extension Limit Edge Cases**: Fixed `apply_extension_limit` with small/zero/negative base lengths
  - Now clamps base_rest_lengths to minimum 0.01 before calculations
  - Ensures max_length >= min_length in all cases
  - Found via integration stress testing (52 edge case tests)

### Added
- **Configurable Physics FPS**: Control simulation fidelity with 15-120 FPS physics
  - Higher FPS = more expressive movement, better muscle resolution
  - Lower FPS = faster simulation runs
  - Default 60 FPS, configurable via menu slider
  - Example: 30s @ 120 FPS = 3600 physics steps for maximum precision
- **Comprehensive Parity Tests**: 88 tests verifying TypeScript/Python behavioral parity
  - Edge-based distance calculation, regression penalty, opposite-half pellet spawning
  - Variable collection radius, settling period, minimum fitness clamp
  - Neural mode permutations, fitness config permutations, batch sizes
- **Integration Tests**: 17 tests verifying frontend-backend config propagation
  - All 28 menu config options flow correctly to backend
  - Frame storage modes, fitness breakdowns, disqualification
- **COMPUTE.md Documentation**: Explains tensor batching, sparse runs, FPS, performance
- **Python Backend with PyTorch Physics**: Complete backend implementation for GPU-ready simulation
  - Batched tensor physics simulation (100+ creatures in <1s on CPU)
  - Batched neural network forward pass for creature control
  - Full genetics system ported from TypeScript (selection, mutation, crossover)
  - FastAPI endpoints for simulation and evolution
  - 417 tests covering physics, neural, fitness, genetics, API, parity, integration
  - See `backend/README.md` for details

### Changed
- **Output Bias replaces Dead Zone**: Replaced runtime dead zone filtering with configurable output bias
  - Output bias (-2 to 0, default -0.5) is baked into neural network weights
  - More negative = muscles harder to activate initially, must evolve to overcome
  - Evolves with population, no runtime filtering needed
  - Removed dead zone code path from BatchSimulator

### Added
- **Neural Config Display Panel**: Expandable dropdown in top-right settings box showing current neural network configuration
- **Mutation Rate Decay Options**: Choose between linear, exponential, or off (constant) decay modes with configurable start/end rates
- **Separate Neural Mutation Rates**: Weight mutation now has dedicated neural-specific rates (`neuralRate`, `neuralMagnitude`) independent of body mutation
- **Info Tooltips**: Added (i) icons for all neural network settings (mode, hidden size, activation, decay) explaining each parameter

### Changed
- **Neural Network Enabled by Default**: `useNeuralNet` now defaults to `true` for new runs
- **Output Bias Constant**: Output biases now use `DEFAULT_OUTPUT_BIAS` constant (-1.5) for consistency
- **Normalized Efficiency Penalty**: Efficiency penalty now uses normalized average muscle activation (0-1 range) instead of accumulated totals

### Fixed
- **Replay Neural Mode Mismatch**: Fixed crash when replaying creatures where neural network mode (pure/hybrid) didn't match expected input size
- **Efficiency Penalty Zero Fitness**: Fixed efficiency penalty accumulating total activation instead of averaging, which was zeroing out all fitness
- **adaptNeuralTopology Xavier Init**: Fixed using Xavier initialization instead of uniform for GA-optimized neural networks
- **adaptNeuralTopology Bias**: Fixed using 0 bias instead of `DEFAULT_OUTPUT_BIAS` for newly added neurons

### Changed
- **Neural Network Optimization for Genetic Algorithms**:
  - **Negative output biases** (-1.5 default): Muscles default to "off" state, must evolve to activate
    - `tanh(-1.5) ≈ -0.9` means muscles start mostly inactive
    - Creates evolutionary pressure to develop purposeful activation
  - **Uniform weight initialization**: Replaced Xavier/Gaussian with uniform [-0.5, 0.5]
    - Simpler search space for GA (no gradient assumptions)
  - **Mode-specific inputs**: Pure mode uses 7 inputs (no time phase), hybrid uses 8
    - Pure mode: NN has full control, time phase would just add noise
    - Hybrid mode: time phase helps sync with base oscillation
  - **Dead zone threshold** (0.1 default): Small outputs become exactly 0 in pure mode
    - Enables true "muscle silence" rather than constant micro-activations
  - **Efficiency penalty**: Fitness penalized by total muscle activation
    - Encourages creatures to achieve results with less "effort"
    - Configurable penalty per unit of activation (default 0.5)
- **Split Movement Fitness**: Replaced single "Movement Max" with two separate components:
  - **Net Displacement Bonus** (0-15 pts): Rate-based straight-line distance from start position
    - Encourages creatures to move away from origin rather than circle back
    - 1 unit/second = full bonus, applied after 0.5s settling period
  - **Distance Traveled Bonus** (0-15 pts): Total ground distance covered
    - 3 points per unit traveled (configurable)
    - Rewards creatures that explore even if they return to start
  - All distance calculations now XZ-only (vertical movement ignored)
  - UI updated with separate sliders for each component

### Added
- **Mutation Rate Decay**: Option to decay neural weight mutation rate over generations
  - **Off**: Constant mutation rate throughout the run
  - **Linear**: Steady decrease from 5x target rate to target over 50 generations
  - **Exponential**: Fast initial drop, then gradual approach to target rate
  - Helps explore solution space early, fine-tune good solutions later
  - Industry-standard approach for evolutionary optimization
- **Info Tooltips**: Added (i) icons to all neural network settings explaining each parameter
- **Brain Evolution Comparison**: New panel to visualize how neural networks evolve over generations
  - **Diff View**: Shows weight changes between Gen 1 average and current generation average
    - Green connections = strengthened weights (positive change)
    - Red connections = weakened weights (negative change)
    - Line thickness indicates magnitude of change
  - **Weight Distribution Histogram**: Overlapping histogram comparing weight distributions
    - Blue = Gen 1 weights, Red = Current generation weights
    - Shows how weight distributions shift during evolution
  - Access via "Compare Brains" button under Best Ever creature (neural net runs only)
- **Longest Survivor Death Generation**: Tracks which generation the longest surviving creature finally died
  - Display format: "12 gens, to Gen 25" (survived 12 generations, died at generation 25)
  - Persisted to IndexedDB with run data
- **Genome Viewer**: Click on a creature in replay mode to view its complete genome including nodes, muscles, and all perception parameters
- **Family Tree Visualization**: View the creature's ancestry up to 5 generations back in a dedicated panel, showing parents, grandparents, and ancestors with their fitness scores and body structure. Loads all stored generations to trace complete lineage.
- **Movement Bonus**: 0-25 points for XZ net displacement over time
  - Uses **XZ net displacement** (ground plane only, ignores Y/falling)
  - Straight-line from start position, NOT total distance traveled
  - Discourages flailing: lots of motion that goes nowhere gets 0 bonus
  - Rewards creatures that move in a consistent direction on the ground
  - Target rate: 1.0 units/second XZ displacement for full 25-point bonus
  - Applied after 0.5s settling period
  - Creates evolutionary stepping stone: stationary → directed motion → toward pellet

### Changed
- **Edge-based Fitness System**: Complete overhaul using ground distance from creature's EDGE
  - All distances measured in XZ plane (ground only, ignoring Y/height)
  - Distance calculated from creature's nearest edge to pellet, not center
  - Creature XZ radius calculated from genome (with 1.3x buffer for muscle extension)
  - Progress: 0-80 points for XZ progress toward pellet (capped at 80)
  - Collection: +20 bonus when pellet is actually collected (requires correct height)
  - Regression penalty: up to -20 if moving away from pellet (after first pellet)
  - Total per pellet: 100 max (80 progress + 20 collection)
- **Opposite-half Pellet Spawning**:
  - Pellets spawn in opposite 180° arc from previous pellet direction
  - Ensures creatures must change direction to collect pellets
  - Distance measured from creature's EDGE (XZ radius + spawn distance)
  - Progressive distances from edge: 1st pellet 7-8 units, 2nd-3rd 8-9 units, 4th+ 9-10 units
  - +4 unit buffer accounts for full muscle extension (chain of muscles can extend far)
- **Creature XZ radius from genome**: Calculated from genome node positions (rest state) with 1.3x buffer for potential extension, independent of current physics state

### Changed
- **Neural Network Output Labels**: Output neurons now show muscle IDs (e.g., "1-3") indicating which body nodes the muscle connects, alongside activation values

### Fixed
- **Efficiency Penalty Calculation**: Fixed critical bug where efficiency penalty accumulated across all frames and muscles, resulting in ~3000 point penalties that zeroed out all fitness. Now uses average activation (0-1 range) for reasonable ~0.25 point penalty.
- **Weight Mutation Rate Slider**: Fixed bug where the Weight Mut. Rate slider in the UI wasn't actually being used - neural networks were using body mutation rate instead
- **Best Creature Persistence**: Fixed bug where "Best Ever" creature wasn't correctly restored when loading a saved run
  - `updateBestCreature` and `updateLongestSurvivor` now properly await IndexedDB writes
  - Best creature tracking fields reset when starting new runs
- **Generation counter bug**: Mutation no longer increments generation. Generation is only incremented during clone/crossover, preventing creatures from showing Gen 22 when simulation is on Gen 11.
- **Pellet spawning from origin**: First pellet now spawns relative to creature's spawn position, not world origin
- **Creatures starting with 50 points**: Removed Y component from distance calculations so falling/settling doesn't count as progress

## [v2] - Velocity Sensing & Distance Awareness

### Added
- **Proprioception (Velocity Sensing)**: Muscles can now sense the creature's own movement direction
  - `velocityBias: Vector3` - Unit vector for preferred movement direction
  - `velocityStrength: number` - How much own velocity affects muscle activation (0-1)
- **Distance Awareness**: Muscles can modulate based on distance to target pellet
  - `distanceBias: number` - Activation preference (-1 = far, +1 = near)
  - `distanceStrength: number` - How much distance affects activation (0-1)
- Modulation formula: `modulation = clamp(1 + directionMod + velocityMod + distanceMod, 0.1, 2.5)`

### Technical
- Updated BatchSimulator to calculate velocity from center-of-mass changes
- Added normalized distance calculation for distance modulation
- All genetics files updated (Mutation.ts, Crossover.ts)
- Test suite updated for new muscle gene fields

## [v1] - Direction-Modulated Muscle Control

### Added
- **Direction Sensing**: Muscles can now "see" the direction to food pellets
  - `directionBias: Vector3` - Unit vector indicating which direction activates this muscle
  - `biasStrength: number` - How much direction affects muscle activation (0 = pure oscillator, 1 = heavily modulated)
- Creatures can now evolve to steer toward pellets rather than moving blindly

### Technical
- Added `dot`, `normalize`, `subtract`, `length` functions to math utilities
- Updated genome generation to initialize direction bias with random unit vectors
- Crossover interpolates direction bias between parents
- Mutation perturbs direction bias while maintaining unit length

## [Previous Releases]

### Features
- **Real-time Playback**: Watch any generation replay with speed controls (0.5x-2x)
- **Run Management**: Name, fork, and delete evolutionary runs
- **Persistence**: Full IndexedDB storage with generation history
- **Configurable Fitness**: Customize fitness weights in the menu
- **Best Creature Tracking**: Automatically saves best performer and longest survivor

### Fixes
- Enforce maxMuscles constraint in crossover and cloning
- Fix fitness recalculation when loading saved runs
- Properly restore simulation state from IndexedDB
- Fix control panel and graph positioning

### Infrastructure
- Comprehensive test suite (280 tests)
- Claude Code configuration for development
- TypeScript with Vite build system
- Three.js for rendering, cannon-es for physics
