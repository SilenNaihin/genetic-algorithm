# Changelog

All notable changes to the Genetic Algorithm Evolution Simulator.

## [Unreleased]

### Added
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

### Fixed
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
- Comprehensive test suite (139 tests)
- Claude Code configuration for development
- TypeScript with Vite build system
- Three.js for rendering, cannon-es for physics
