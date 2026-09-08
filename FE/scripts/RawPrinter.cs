using System;
using System.IO;
using System.Runtime.InteropServices;

public class RawPrinter
{
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
    public class DOCINFOA
    {
        [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
        [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
        [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
    }

    [DllImport("winspool.Drv", EntryPoint = "OpenPrinterA", SetLastError = true, CharSet = CharSet.Ansi, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool OpenPrinter([MarshalAs(UnmanagedType.LPStr)] string szPrinter, out IntPtr hPrinter, IntPtr pd);

    [DllImport("winspool.Drv", EntryPoint = "ClosePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool ClosePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "StartDocPrinterA", SetLastError = true, CharSet = CharSet.Ansi, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool StartDocPrinter(IntPtr hPrinter, Int32 level, [In, MarshalAs(UnmanagedType.LPStruct)] DOCINFOA di);

    [DllImport("winspool.Drv", EntryPoint = "EndDocPrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool EndDocPrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "StartPagePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool StartPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "EndPagePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool EndPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "WritePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, Int32 dwCount, out Int32 dwWritten);

    public static bool SendBytes(string printerName, byte[] bytes)
    {
        IntPtr pUnmanagedBytes = Marshal.AllocCoTaskMem(bytes.Length);
        Marshal.Copy(bytes, 0, pUnmanagedBytes, bytes.Length);
        IntPtr hPrinter;
        DOCINFOA di = new DOCINFOA();
        di.pDocName = "ThermalReceipt";
        di.pDataType = "RAW";

        bool success = false;
        if (OpenPrinter(printerName, out hPrinter, IntPtr.Zero))
        {
            if (StartDocPrinter(hPrinter, 1, di))
            {
                if (StartPagePrinter(hPrinter))
                {
                    int dwWritten = 0;
                    success = WritePrinter(hPrinter, pUnmanagedBytes, bytes.Length, out dwWritten);
                    EndPagePrinter(hPrinter);
                }
                EndDocPrinter(hPrinter);
            }
            ClosePrinter(hPrinter);
        }
        else
        {
            int err = Marshal.GetLastWin32Error();
            Console.Error.WriteLine("OpenPrinter failed with error code: " + err);
        }
        Marshal.FreeCoTaskMem(pUnmanagedBytes);
        return success;
    }

    public static int Main(string[] args)
    {
        if (args.Length < 2)
        {
            Console.WriteLine("Usage: RawPrinter <PrinterName> <FilePathOrBase64> [--base64]");
            return 1;
        }

        string printerName = args[0];
        string input = args[1];
        byte[] bytes;

        try
        {
            if (args.Length > 2 && args[2] == "--base64")
            {
                bytes = Convert.FromBase64String(input);
            }
            else if (File.Exists(input))
            {
                bytes = File.ReadAllBytes(input);
            }
            else
            {
                bytes = Convert.FromBase64String(input);
            }

            bool ok = SendBytes(printerName, bytes);
            if (ok)
            {
                Console.WriteLine("SUCCESS");
                return 0;
            }
            else
            {
                Console.Error.WriteLine("FAILED_TO_SEND");
                return 2;
            }
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine("ERROR: " + ex.Message);
            return 3;
        }
    }
}
