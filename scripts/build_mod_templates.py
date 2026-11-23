"""Rebuild the distributed STS2 source and prebuilt ZIPs from mod-template."""

from __future__ import annotations

import argparse
import io
import os
import subprocess
import tempfile
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1] / "sts2-mod-generator"
TEMPLATE = ROOT / "mod-template"
DOWNLOADS = ROOT / "downloads"
SOURCE = DOWNLOADS / "CharacterStarter-source.zip"
BUILT = DOWNLOADS / "CharacterStarter-built.zip"
MOD_ROOT = "CharacterStarter/"


def rewrite_zip(original: Path, updates: dict[str, bytes]) -> bytes:
    result = io.BytesIO()
    with zipfile.ZipFile(original) as old, zipfile.ZipFile(result, "w", zipfile.ZIP_DEFLATED) as new:
        existing = set()
        for info in old.infolist():
            if info.filename == '.gitignore' or {'obj', 'bin'} & set(Path(info.filename).parts):
                continue
            existing.add(info.filename)
            new.writestr(info, updates.get(info.filename, old.read(info.filename)))
        for name, data in updates.items():
            if name not in existing:
                new.writestr(name, data)
    return result.getvalue()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--game-data-dir",
        type=Path,
        default=Path("C:/Program Files (x86)/Steam/steamapps/common/Slay the Spire 2/data_sts2_windows_x86_64"),
    )
    args = parser.parse_args()
    game_data = args.game_data_dir.resolve()
    if not (game_data / "sts2.dll").is_file():
        parser.error(f"sts2.dll not found in {game_data}")

    source_updates = {
        path.relative_to(TEMPLATE).as_posix(): path.read_bytes()
        for path in TEMPLATE.rglob("*")
        if path.is_file()
        and path.relative_to(TEMPLATE).parts[0] == 'CharacterStarter'
        and not {'obj', 'bin'} & set(path.relative_to(TEMPLATE).parts)
    }
    source_bytes = rewrite_zip(SOURCE, source_updates)

    with tempfile.TemporaryDirectory(prefix="sts2-mod-build-") as temp_name:
        temp = Path(temp_name)
        source_archive = temp / "source.zip"
        source_archive.write_bytes(source_bytes)
        with zipfile.ZipFile(source_archive) as archive:
            archive.extractall(temp / "project")
        project = temp / "project" / "CharacterStarter"
        nuget_config = temp / "NuGet.Config"
        nuget_config.write_text(
            '<configuration><packageSources><clear /></packageSources></configuration>',
            encoding="utf-8",
        )
        build_env = os.environ.copy()
        build_env["APPDATA"] = str(temp / "AppData")
        (temp / "AppData" / "NuGet").mkdir(parents=True)
        (temp / "AppData" / "NuGet" / "NuGet.Config").write_bytes(nuget_config.read_bytes())
        subprocess.run(
            ["dotnet", "restore", str(project / "CharacterStarter.csproj"),
             "--configfile", str(nuget_config)],
            check=True,
            env=build_env,
        )
        subprocess.run(
            ["dotnet", "build", str(project / "CharacterStarter.csproj"), "-c", "Release", "--no-restore",
             f"-p:GameDataDir={game_data}"],
            check=True,
            env=build_env,
        )
        dll = project / "bin" / "Release" / "net9.0" / "CharacterStarter.dll"
        if not dll.is_file():
            raise RuntimeError(f"Build did not produce {dll}")
        built_updates = {
            f"{MOD_ROOT}CharacterStarter.dll": dll.read_bytes(),
            f"{MOD_ROOT}CharacterStarter.json": source_updates[f"{MOD_ROOT}CharacterStarter.json"],
            f"{MOD_ROOT}character.json": source_updates[f"{MOD_ROOT}character.json"],
            f"{MOD_ROOT}attack-card.json": source_updates[f"{MOD_ROOT}attack-card.json"],
            f"{MOD_ROOT}README.txt": source_updates[f"{MOD_ROOT}README.md"],
        }
        built_bytes = rewrite_zip(BUILT, built_updates)

    for target, contents in ((SOURCE, source_bytes), (BUILT, built_bytes)):
        staged = target.with_suffix(".zip.tmp")
        staged.write_bytes(contents)
        os.replace(staged, target)
        print(f"Updated {target.relative_to(ROOT.parent)} ({len(contents)} bytes)")


if __name__ == "__main__":
    main()
