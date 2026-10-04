"""Strict offline validator for the game's cosmetic catalog and PNG dimensions."""
import json
from pathlib import Path
import struct
from typing import Annotated, Literal, Self
from pydantic import BaseModel, ConfigDict, Field, TypeAdapter, model_validator

Positive = Annotated[int, Field(ge=1, le=256)]

class Crop(BaseModel):
    model_config = ConfigDict(strict=True, extra="forbid")
    x: Annotated[int, Field(ge=0, le=255)]
    y: Annotated[int, Field(ge=0, le=255)]
    width: Positive
    height: Positive

class Asset(BaseModel):
    model_config = ConfigDict(strict=True, extra="forbid")
    id: Annotated[str, Field(pattern=r"^[a-z][a-z0-9-]{0,31}$")]
    width: Positive
    height: Positive
    frames: Annotated[int, Field(ge=1, le=32)]
    durationsMs: list[Annotated[int, Field(ge=1, le=10000)]]
    source: str
    role: Literal["selectable cosmetic", "reference only"]
    crop: Crop

    @model_validator(mode="after")
    def bounds(self) -> Self:
        if len(self.durationsMs) != self.frames:
            raise ValueError("Frame duration count mismatch")
        if self.crop.x + self.crop.width > self.width or self.crop.y + self.crop.height > self.height:
            raise ValueError("Crop outside source frame")
        return self

def validate_catalog(value: object) -> list[Asset]:
    assets = TypeAdapter(list[Asset]).validate_python(value, strict=True)
    if not 1 <= len(assets) <= 16 or len({a.id for a in assets}) != len(assets):
        raise ValueError("Invalid catalog size or duplicate IDs")
    return assets

def validate_files(root: Path) -> int:
    assets = validate_catalog(json.loads((root / "manifest.json").read_text()))
    for asset in assets:
        data = (root / f"{asset.id}.png").read_bytes()
        if data[:8] != b"\x89PNG\r\n\x1a\n" or len(data) > 2_000_000 or len(data) < 24:
            raise ValueError(f"Invalid PNG: {asset.id}")
        width, height = struct.unpack(">II", data[16:24])
        if (width, height) != (asset.width * asset.frames, asset.height):
            raise ValueError(f"Sheet dimensions mismatch: {asset.id}")
    return len(assets)

if __name__ == "__main__":
    print(f"Validated {validate_files(Path(__file__).resolve().parents[1] / 'preview/assets')} assets")
