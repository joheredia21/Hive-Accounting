
# Hive Accounting - Development Guide

## Code Style
- **Naming**: PascalCase for components, camelCase for functions/variables, kebab-case for files.
- **Types**: Use interfaces for object shapes, types for unions/aliases.
- **Components**: Prefer functional components with hooks.
- **State**: Local state first $\rightarrow$ Context $\rightarrow$ Global Store.

## Development Workflow
1. Create a new feature in `src/features`.
2. Implement shared components in `src/components/common`.
3. Define types in `src/types`.
4. Add utility functions in `src/utils`.

## Common Commands
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run lint`: Check for code style issues

## Hive Master Skill
This project follows the standards and patterns defined in the **hive-master** skill. AI agents should refer to this skill for expert knowledge on Hive blockchain development, including API calls, operation builders, and battle-tested workarounds.

**Skill Path**: `C:\Users\Usuario\Desktop\Proyectos\Proyectos para Hive\Claude Hive\~\.claude\skills\hive-master`

**Key Reference Files within Skill**:
- `SKILL.md`: Entry point and core principles.
- `operations.md`: Reference for all Hive blockchain operations.
- `battle-tested.md`: Production-ready patterns and gotchas.
- `hive-engine.md`: Layer 2 token operations.
