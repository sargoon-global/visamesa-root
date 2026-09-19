import Foundation
import UIKit
import React

@objc(PdfViewer)
class PdfViewer: NSObject, UIDocumentInteractionControllerDelegate {
  private var documentInteractionController: UIDocumentInteractionController?
  private weak var previewHostViewController: UIViewController?
  private var openPdfResolve: RCTPromiseResolveBlock?
  private var openPdfReject: RCTPromiseRejectBlock?
  private var previewOpened = false
  private var hasResolvedOpenPdf = false

  @objc
  static func requiresMainQueueSetup() -> Bool {
    true
  }

  @objc(savePdfBase64:fileName:resolver:rejecter:)
  func savePdfBase64(
    _ base64: String,
    fileName: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let data = Data(base64Encoded: base64) else {
      reject("PDF_SAVE_FAILED", "Invalid base64 PDF data", nil)
      return
    }

    guard let directory = FileManager.default.urls(
      for: .documentDirectory,
      in: .userDomainMask
    ).first else {
      reject("PDF_SAVE_FAILED", "Could not resolve documents directory", nil)
      return
    }

    let fileUrl = directory.appendingPathComponent(fileName)

    do {
      try data.write(to: fileUrl)
      resolve([
        "fileName": fileName,
        "path": fileUrl.path,
        "uri": fileUrl.absoluteString,
      ])
    } catch {
      reject("PDF_SAVE_FAILED", error.localizedDescription, error)
    }
  }

  @objc(openPdf:resolver:rejecter:)
  func openPdf(
    _ pathOrUri: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      self.resetOpenPdfState()
      self.openPdfResolve = resolve
      self.openPdfReject = reject

      let path = pathOrUri.replacingOccurrences(of: "file://", with: "")
      let fileUrl = URL(fileURLWithPath: path)

      guard FileManager.default.fileExists(atPath: fileUrl.path) else {
        self.rejectOpenPdf(
          code: "PDF_NOT_FOUND",
          message: "PDF file does not exist: \(fileUrl.path)",
          error: nil
        )
        return
      }

      guard let hostViewController = Self.topViewController() else {
        self.rejectOpenPdf(
          code: "PDF_OPEN_FAILED",
          message: "Could not find a view controller to present the PDF opener",
          error: nil
        )
        return
      }

      self.previewHostViewController = hostViewController

      let controller = UIDocumentInteractionController(url: fileUrl)
      controller.delegate = self
      controller.name = fileUrl.lastPathComponent
      controller.uti = "com.adobe.pdf"
      self.documentInteractionController = controller

      // Open Quick Look directly for in-app review. The options menu's
      // "Preview" / external-app paths can fail and send the user to the home screen.
      if controller.presentPreview(animated: true) {
        self.previewOpened = true
        return
      }

      let sourceView = hostViewController.view ?? UIView()
      let sourceRect = CGRect(
        x: sourceView.bounds.midX,
        y: sourceView.bounds.midY,
        width: 1,
        height: 1
      )

      let didPresent = controller.presentOptionsMenu(
        from: sourceRect,
        in: sourceView,
        animated: true
      )

      if !didPresent {
        self.rejectOpenPdf(
          code: "NO_PDF_VIEWER",
          message: "No app is available to open PDF files",
          error: nil
        )
      }
    }
  }

  func documentInteractionControllerViewControllerForPreview(
    _ controller: UIDocumentInteractionController
  ) -> UIViewController {
    previewOpened = true
    return previewHostViewController ?? Self.topViewController() ?? UIViewController()
  }

  func documentInteractionControllerDidEndPreview(
    _ controller: UIDocumentInteractionController
  ) {
    resolveOpenPdfIfNeeded()
  }

  func documentInteractionControllerDidDismissOptionsMenu(
    _ controller: UIDocumentInteractionController
  ) {
    if !previewOpened {
      resolveOpenPdfIfNeeded()
    }
  }

  private func resolveOpenPdfIfNeeded() {
    guard !hasResolvedOpenPdf, let resolve = openPdfResolve else {
      return
    }

    hasResolvedOpenPdf = true
    openPdfResolve = nil
    openPdfReject = nil
    previewOpened = false
    previewHostViewController = nil
    documentInteractionController = nil
    resolve(nil)
  }

  private func rejectOpenPdf(code: String, message: String, error: Error?) {
    guard !hasResolvedOpenPdf, let reject = openPdfReject else {
      return
    }

    hasResolvedOpenPdf = true
    openPdfResolve = nil
    openPdfReject = nil
    previewOpened = false
    previewHostViewController = nil
    documentInteractionController = nil
    reject(code, message, error)
  }

  private func resetOpenPdfState() {
    hasResolvedOpenPdf = false
    previewOpened = false
    previewHostViewController = nil
    openPdfResolve = nil
    openPdfReject = nil
    documentInteractionController = nil
  }

  private static func topViewController() -> UIViewController? {
    let windowScene = UIApplication.shared.connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .first { $0.activationState == .foregroundActive }
    let rootViewController = windowScene?.windows.first { $0.isKeyWindow }?.rootViewController
    return topViewController(from: rootViewController)
  }

  private static func topViewController(from viewController: UIViewController?) -> UIViewController? {
    if let navigationController = viewController as? UINavigationController {
      return topViewController(from: navigationController.visibleViewController)
    }

    if let tabBarController = viewController as? UITabBarController {
      return topViewController(from: tabBarController.selectedViewController)
    }

    if let presentedViewController = viewController?.presentedViewController {
      return topViewController(from: presentedViewController)
    }

    return viewController
  }
}
