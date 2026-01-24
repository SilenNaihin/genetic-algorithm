# Fitness Function Update Checklist

Use this checklist when modifying the fitness function to ensure all related components are updated.

## Files to Update

1. **src/simulation/BatchSimulator.ts**
   - `calculateCurrentFitness()` function (~line 371)
   - Track any new metrics during simulation loop
   - Update final fitness calculation

2. **src/types/simulation.ts**
   - Add new config parameters (e.g., `fitnessNewBonus: number`)
   - Add defaults to `DEFAULT_CONFIG`

3. **src/main.ts**
   - Add UI controls in fitness settings panel
   - Update `getSettingsInfoHTML()` for the config display
   - Add tooltips if needed

4. **src/ui/InfoTooltip.ts**
   - Add tooltip text for new fitness parameters

## Fitness Components Reference

Current fitness formula (all distances measured from creature edge, XZ-only):
```
fitness = pellets * pelletPoints              // 20 per pellet (on top of 80 progress = 100 total)
        + progress * progressMax              // 0-80 progress toward current pellet (edge distance)
        + distanceBonus                       // 0-20 total distance traveled
        - regressionPenalty                   // 0-20 for moving away (only after first collection)
        - muscleActivation * efficiencyPenalty  // Penalize excessive activation
```

## Checklist

- [ ] Added config parameter with default
- [ ] Updated `calculateCurrentFitness()` function
- [ ] Added tracking during simulation if needed
- [ ] Added UI slider/input in fitness panel
- [ ] Updated Neural Config display if relevant
- [ ] Added tooltip explaining the parameter
- [ ] Updated CLAUDE.md fitness formula if changed
- [ ] Added CHANGELOG entry
- [ ] Tested manually that new parameter affects fitness

## Testing

1. Run with new parameter at default - should match previous behavior
2. Run with extreme values - verify expected effect
3. Check fitness-over-time graph shows reasonable progression
