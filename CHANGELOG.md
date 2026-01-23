# Changelog

All notable changes to the Genetic Algorithm Evolution Simulator.

## [Unreleased]

### Added
- **Python Backend with PyTorch Physics**: Complete backend implementation for GPU-ready simulation
  - Batched tensor physics simulation (100+ creatures in <1s on CPU)
  - Batched neural network forward pass for creature control
  - Full genetics system ported from TypeScript (selection, mutation, crossover)
  - FastAPI endpoints for simulation and evolution
  - 285 tests covering physics, neural, fitness, genetics, API integration
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
