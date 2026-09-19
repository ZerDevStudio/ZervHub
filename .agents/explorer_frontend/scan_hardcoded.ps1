$csharp = @"
using System;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;
using System.Collections.Generic;
using System.Web.Script.Serialization;

public class HardcodedStringAuditor {
    public static void Run(string srcDir, string outReportPath) {
        var js = new JavaScriptSerializer();
        js.MaxJsonLength = int.MaxValue;

        var allFiles = Directory.GetFiles(srcDir, "*.tsx", SearchOption.AllDirectories);
        var issues = new List<Dictionary<string, object>>();

        // Regex for Turkish characters in JSX or string literals
        var trCharRegex = new Regex(@"[çğışöüÇĞİŞÖÜ]");
        // Regex for JSX plain text e.g. >Some English or Turkish Text<
        var jsxTextRegex = new Regex(@">([^<>{}\n\r]+)<");

        foreach (var file in allFiles) {
            string relFile = file.Substring(srcDir.Length).TrimStart('\\', '/');
            string[] lines = File.ReadAllLines(file, Encoding.UTF8);

            for (int i = 0; i < lines.Length; i++) {
                string line = lines[i].Trim();
                if (line.StartsWith("//") || line.StartsWith("/*") || line.StartsWith("*")) continue;

                // Check 1: Hardcoded Turkish characters outside t(...) calls
                if (trCharRegex.IsMatch(line) && !line.Contains("t('") && !line.Contains("t(\"")) {
                    // Filter out comments
                    int commentIdx = line.IndexOf("//");
                    string codePart = commentIdx >= 0 ? line.Substring(0, commentIdx) : line;
                    if (trCharRegex.IsMatch(codePart)) {
                        var issue = new Dictionary<string, object>();
                        issue["id"] = "I18N-TR-HARDCODED";
                        issue["file"] = relFile;
                        issue["line"] = i + 1;
                        issue["type"] = "Hardcoded Turkish String";
                        issue["snippet"] = line;
                        issues.Add(issue);
                    }
                }

                // Check 2: Raw JSX text bypassing t(...)
                var match = jsxTextRegex.Match(line);
                if (match.Success) {
                    string rawText = match.Groups[1].Value.Trim();
                    // Ignore whitespace, single symbols, numbers, punctuation
                    if (rawText.Length > 2 && Regex.IsMatch(rawText, @"[a-zA-Z]{3,}") && !line.Contains("{t(") && !line.Contains("t('")) {
                        var issue = new Dictionary<string, object>();
                        issue["id"] = "I18N-JSX-RAW";
                        issue["file"] = relFile;
                        issue["line"] = i + 1;
                        issue["type"] = "Raw JSX Text Bypassing i18n";
                        issue["snippet"] = line;
                        issue["text"] = rawText;
                        issues.Add(issue);
                    }
                }
            }
        }

        var res = new Dictionary<string, object>();
        res["totalIssues"] = issues.Count;
        res["issues"] = issues;

        File.WriteAllText(outReportPath, js.Serialize(res), Encoding.UTF8);
        Console.WriteLine("Hardcoded scan complete. Found " + issues.Count + " occurrences.");
    }
}
"@

Add-Type -TypeDefinition $csharp -ReferencedAssemblies "System.Web.Extensions"
$srcDir = "c:\Users\BERKE\.gemini\antigravity\scratch\NexusHub\src\renderer\src"
$outReportPath = "c:\Users\BERKE\.gemini\antigravity\scratch\NexusHub\.agents\explorer_frontend\hardcoded_strings_report.json"

[HardcodedStringAuditor]::Run($srcDir, $outReportPath)
