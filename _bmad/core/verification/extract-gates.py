#!/usr/bin/env python3
"""
Extract gates from BMAD story YAML files.
Usage: python extract-gates.py <story-file>
Output: name|type|command|expected_exit (one per line)
"""

import sys
import yaml

def extract_gates(story_file):
    """Extract verification gates from a story YAML file."""
    try:
        with open(story_file, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)

        if not data:
            return []

        verification = data.get('verification', {})
        gates = verification.get('gates', [])

        results = []
        for gate in gates:
            name = gate.get('name', 'Unknown')
            gate_type = gate.get('type', 'command')
            command = gate.get('command', '')
            expected_exit = gate.get('expected_exit', 0)

            # Output in pipe-delimited format
            results.append(f"{name}|{gate_type}|{command}|{expected_exit}")

        return results

    except FileNotFoundError:
        print(f"Error: File not found: {story_file}", file=sys.stderr)
        return []
    except yaml.YAMLError as e:
        print(f"Error: Invalid YAML: {e}", file=sys.stderr)
        return []
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return []

def main():
    if len(sys.argv) < 2:
        print("Usage: python extract-gates.py <story-file>", file=sys.stderr)
        sys.exit(1)

    story_file = sys.argv[1]
    gates = extract_gates(story_file)

    for gate in gates:
        print(gate)

if __name__ == '__main__':
    main()
