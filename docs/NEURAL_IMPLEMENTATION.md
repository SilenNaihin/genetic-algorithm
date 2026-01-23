# Neural Network Implementation

This document describes the neural network implementation for creature control.

## Architecture

```
INPUTS (8)              HIDDEN (8, tanh)         OUTPUTS (N muscles)
═══════════             ════════════════         ═══════════════════

pellet_dir_x  ─────┐                         ┌─── muscle_0 [-1, 1]
pellet_dir_y  ─────┤    ┌───────────────┐    │
pellet_dir_z  ─────┼────┤               ├────┼─── muscle_1 [-1, 1]
velocity_x    ─────┤    │   8 neurons   │    │
velocity_y    ─────┼────┤     tanh      ├────┼─── muscle_2 [-1, 1]
velocity_z    ─────┤    │  activation   │    │
pellet_dist   ─────┼────┤               ├────┼─── ...
time_phase    ─────┘    └───────────────┘    │
                                             └─── muscle_N [-1, 1]
```

### Sensor Inputs

| Input | Range | Description |
|-------|-------|-------------|
| `pellet_dir_x` | [-1, 1] | X component of unit vector to pellet |
| `pellet_dir_y` | [-1, 1] | Y component of unit vector to pellet |
| `pellet_dir_z` | [-1, 1] | Z component of unit vector to pellet |
| `velocity_x` | [-1, 1] | X component of creature velocity (normalized) |
| `velocity_y` | [-1, 1] | Y component of creature velocity (normalized) |
| `velocity_z` | [-1, 1] | Z component of creature velocity (normalized) |
| `pellet_dist` | [0, 1] | Normalized distance to pellet |
| `time_phase` | [-1, 1] | sin(time × 2π) for rhythmic behaviors |

### Weight Count

For a creature with N muscles:
- Input → Hidden: 8 × 8 = 64 weights + 8 biases = **72 parameters**
- Hidden → Output: 8 × N = 8N weights + N biases = **9N parameters**
- **Total**: 72 + 9N parameters

---

## Control Modes

### Hybrid Mode (default)

Neural network output modulates the base oscillator:

```python
base = sin(time * frequency * 2π + phase)
nn_output = network.forward(sensors)  # in [-1, 1]
modulation = 0.5 + (nn_output + 1) * 0.5  # [0.5, 1.5]
contraction = base * amplitude * modulation
```

### Pure Mode

Neural network directly controls muscle contraction:

```python
nn_output = network.forward(sensors)  # in [-1, 1]
contraction = nn_output * amplitude
```

---

## Batched Forward Pass

All creatures evaluated in parallel using PyTorch tensors:

```python
# Tensor shapes: B = batch size (num creatures)
weights_ih: [B, input_size, hidden_size]
weights_ho: [B, hidden_size, output_size]
inputs: [B, input_size]

# Batched forward pass using einsum
hidden = tanh(einsum('bi,bih->bh', inputs, weights_ih) + bias_h)
output = tanh(einsum('bh,bho->bo', hidden, weights_ho) + bias_o)
```

---

## GA Optimization Techniques

### Output Bias (Negative Initialization)

Output biases initialized to negative value (default -0.5):
- Muscles start relaxed
- Must evolve meaningful input patterns to activate
- Reduces energy waste from constant firing

### Uniform Weight Initialization

Uniform distribution `[-0.5, 0.5]` instead of Gaussian:
- Better exploration of weight space for GA
- No gradient flow assumptions

### Mutation Decay

Mutation magnitude decreases over generations:
- **Linear**: `mag = start - (start - end) * (gen / duration)`
- **Exponential**: `mag = end + (start - end) * exp(-gen / tau)`

---

## Evolution Operators

### Weight Mutation

```python
def mutate_neural_weights(weights, rate, magnitude):
    for i in range(len(weights)):
        if random() < rate:
            weights[i] += random_normal() * magnitude
    return weights
```

### Weight Crossover

```python
def crossover_neural_weights(parent1, parent2):
    child = []
    for w1, w2 in zip(parent1, parent2):
        child.append(w1 if random() < 0.5 else w2)
    return child
```

### Topology Adaptation

When muscle count changes (structural mutation), neural network adapts:
- Add muscle: Add output neuron with uniform weights, negative bias
- Remove muscle: Remove corresponding output neuron

---

## File Structure

```
backend/app/
├── neural/
│   └── network.py            # BatchedNeuralNetwork class
├── simulation/
│   └── physics.py            # gather_sensor_inputs, simulate_with_neural
├── genetics/
│   ├── mutation.py           # mutate_neural_weights
│   ├── crossover.py          # crossover_neural_weights, adapt_neural_topology
│   └── population.py         # initialize_neural_genome
└── schemas/
    └── genome.py             # NeuralGenome schema
```

---

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `use_neural_net` | true | Enable neural network control |
| `neural_mode` | 'hybrid' | 'hybrid' or 'pure' control mode |
| `hidden_size` | 8 | Neurons in hidden layer |
| `activation` | 'tanh' | Activation function |
| `neural_output_bias` | -0.5 | Initial bias for output neurons |
| `weight_mutation_rate` | 0.1 | Probability each weight mutates |
| `weight_mutation_magnitude` | 0.3 | Std dev of perturbation |
| `weight_mutation_decay` | 'linear' | Decay mode: 'off', 'linear', 'exponential' |

---

## Future: NEAT

See [NEAT_FUTURE.md](./NEAT_FUTURE.md) for topology evolution roadmap.
