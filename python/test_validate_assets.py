import copy
import json
from pathlib import Path
import unittest
from validate_assets import validate_catalog, validate_files

class CatalogTests(unittest.TestCase):
    def test_current_files(self) -> None:
        self.assertEqual(validate_files(Path(__file__).resolve().parents[1] / 'preview/assets'), 8)

    def test_rejects_coercion_paths_crops_and_duplicates(self) -> None:
        value = json.loads((Path(__file__).resolve().parents[1] / 'preview/assets/manifest.json').read_text())
        for key, replacement in [('width', '96'), ('id', '../escape'), ('frames', 0), ('durationsMs', [0])]:
            bad = copy.deepcopy(value)
            bad[0][key] = replacement
            with self.assertRaises(ValueError):
                validate_catalog(bad)
        bad = copy.deepcopy(value)
        bad[0]['crop']['width'] = bad[0]['width'] + 1
        with self.assertRaises(ValueError):
            validate_catalog(bad)
        with self.assertRaises(ValueError):
            validate_catalog(value + [value[0]])

if __name__ == '__main__':
    unittest.main()
