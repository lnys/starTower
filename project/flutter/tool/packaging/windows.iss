#ifndef AppVersion
  #define AppVersion "1.0.5"
#endif
[Setup]
AppId={{66CD88D3-1358-4E61-9B3A-8877A4191348}
AppName=星穹塔 Flutter
AppVersion={#AppVersion}
AppPublisher=fastmini
DefaultDirName={localappdata}\Programs\StarDomeTowerFlutter
DefaultGroupName=星穹塔 Flutter
PrivilegesRequired=lowest
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
OutputDir=..\..\release
OutputBaseFilename=StarDomeTower-Flutter-{#AppVersion}-windows-x64-setup
SetupIconFile=..\..\windows\runner\resources\app_icon.ico
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
UninstallDisplayIcon={app}\star_tower.exe
[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"
[Tasks]
Name: "desktopicon"; Description: "Create a desktop shortcut"; Flags: unchecked
[Files]
Source: "..\..\build\windows\x64\runner\Release\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
[Icons]
Name: "{group}\星穹塔"; Filename: "{app}\star_tower.exe"
Name: "{autodesktop}\星穹塔"; Filename: "{app}\star_tower.exe"; Tasks: desktopicon
[Run]
Filename: "{app}\star_tower.exe"; Description: "Launch Star Dome Tower"; Flags: nowait postinstall skipifsilent
