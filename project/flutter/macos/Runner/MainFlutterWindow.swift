import Cocoa
import FlutterMacOS

class MainFlutterWindow: NSWindow {
  override func awakeFromNib() {
    let flutterViewController = FlutterViewController()
    self.contentViewController = flutterViewController
    let screenFrame = (self.screen ?? NSScreen.main)!.frame
    let gameFrame = NSRect(
      x: screenFrame.minX + screenFrame.width * 0.375,
      y: screenFrame.minY + screenFrame.height * 0.1,
      width: screenFrame.width * 0.25,
      height: screenFrame.height * 0.8)
    self.setFrame(gameFrame, display: true)
    let contentSize = self.contentRect(forFrameRect: gameFrame).size
    self.contentMinSize = contentSize
    self.contentMaxSize = contentSize
    self.styleMask.remove(.resizable)
    self.collectionBehavior = [.fullScreenNone]
    self.standardWindowButton(.zoomButton)?.isEnabled = false

    RegisterGeneratedPlugins(registry: flutterViewController)

    super.awakeFromNib()
  }
}
