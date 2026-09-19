$csharp = @"
using System;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;
using System.Collections.Generic;
using System.Web.Script.Serialization;

public class CodeHealthAuditor {
    public static void Run(string srcDir, string outReportPath) {
        var js = new JavaScriptSerializer();
        js.MaxJsonLength = int.MaxValue;

        var allFiles = Directory.GetFiles(srcDir, "*.tsx", SearchOption.AllDirectories);
        var issues = new List<Dictionary<string, object>>();

        foreach (var file in allFiles) {
            string relFile = file.Substring(srcDir.Length).TrimStart('\\', '/');
            string[] lines = File.ReadAllLines(file, Encoding.UTF8);
            string fullContent = File.ReadAllText(file, Encoding.UTF8);

            // 1. Check for setInterval / setTimeout in useEffect without cleanup
            var useEffectMatches = Regex.Matches(fullContent, @"useEffect\s*\(\s*(?:\(\s*\)\s*=>|function\s*\(\s*\))\s*\{([\s\S]*?)\}\s*,\s*\[([^\]]*)\]\s*\)");
            foreach (Match m in useEffectMatches) {
                string body = m.Groups[1].Value;
                bool hasInterval = body.Contains("setInterval(");
                bool hasTimeout = body.Contains("setTimeout(");
                bool hasAddListener = body.Contains("addEventListener(");
                bool hasIpcSub = Regex.IsMatch(body, @"window\.nexusAPI\?\.([a-zA-Z0-9_]+)\?\.on");

                bool hasReturn = body.Contains("return");

                if ((hasInterval || hasAddListener || hasIpcSub) && !hasReturn) {
                    int lineNum = GetLineNumber(fullContent, m.Index);
                    var issue = new Dictionary<string, object>();
                    issue["id"] = "CLEANUP-01";
                    issue["file"] = relFile;
                    issue["line"] = lineNum;
                    issue["type"] = "Missing useEffect Cleanup";
                    issue["severity"] = "High";
                    issue["detail"] = "useEffect sets intervals, event listeners, or IPC subscriptions without a return cleanup function.";
                    issue["snippet"] = m.Value.Length > 250 ? m.Value.Substring(0, 250) + "..." : m.Value;
                    issues.Add(issue);
                }
            }

            // 2. Check for unhandled .then() without .catch()
            var thenMatches = Regex.Matches(fullContent, @"(\.then\s*\([^\)]+\))(?!\s*\.catch)");
            foreach (Match m in thenMatches) {
                // Check if .catch is somewhere within the next 150 chars
                int nextIndex = m.Index + m.Length;
                int remainingLen = Math.Min(150, fullContent.Length - nextIndex);
                string ahead = fullContent.Substring(nextIndex, remainingLen);
                if (!ahead.Contains(".catch")) {
                    int lineNum = GetLineNumber(fullContent, m.Index);
                    var issue = new Dictionary<string, object>();
                    issue["id"] = "ASYNC-01";
                    issue["file"] = relFile;
                    issue["line"] = lineNum;
                    issue["type"] = "Unhandled Promise (.then without .catch)";
                    issue["severity"] = "Medium";
                    issue["detail"] = "Promise chain has .then() but lacks .catch(), leading to unhandled promise rejection.";
                    issue["snippet"] = m.Value;
                    issues.Add(issue);
                }
            }

            // 3. Check for URL.createObjectURL without revokeObjectURL in file
            if (fullContent.Contains("URL.createObjectURL(") && !fullContent.Contains("URL.revokeObjectURL(")) {
                int index = fullContent.IndexOf("URL.createObjectURL(");
                int lineNum = GetLineNumber(fullContent, index);
                var issue = new Dictionary<string, object>();
                issue["id"] = "MEM-01";
                issue["file"] = relFile;
                issue["line"] = lineNum;
                issue["type"] = "Dangling Blob URL Memory Leak";
                issue["severity"] = "Medium";
                issue["detail"] = "URL.createObjectURL is used but URL.revokeObjectURL is never called in this component.";
                issue["snippet"] = lines[lineNum - 1];
                issues.Add(issue);
            }

            // 4. Check for direct DOM manipulation (document.getElementById, document.querySelector)
            var domMatches = Regex.Matches(fullContent, @"(document\.(?:getElementById|querySelector|getElementsByClassName|getElementsByTagName)\s*\([^\)]+\))");
            foreach (Match m in domMatches) {
                // Ignore document.documentElement.setAttribute('data-theme')
                int lineNum = GetLineNumber(fullContent, m.Index);
                var issue = new Dictionary<string, object>();
                issue["id"] = "DOM-01";
                issue["file"] = relFile;
                issue["line"] = lineNum;
                issue["type"] = "Direct DOM Manipulation in React";
                issue["severity"] = "Low";
                issue["detail"] = "Direct document element querying bypasses React virtual DOM and refs.";
                issue["snippet"] = m.Value;
                issues.Add(issue);
            }

            // 5. Check for heavy regex compilation or computations outside useMemo
            // E.g. in render body: new RegExp(...)
            for (int i = 0; i < lines.Length; i++) {
                string l = lines[i];
                if (l.Contains("new RegExp(") && !fullContent.Contains("useMemo") && !l.Contains("const ") && !l.Contains("let ")) {
                    var issue = new Dictionary<string, object>();
                    issue["id"] = "PERF-01";
                    issue["file"] = relFile;
                    issue["line"] = i + 1;
                    issue["type"] = "Unmemoized RegExp in Render";
                    issue["severity"] = "Low";
                    issue["detail"] = "RegExp is instantiated inside render without memoization.";
                    issue["snippet"] = l.Trim();
                    issues.Add(issue);
                }
            }
        }

        var res = new Dictionary<string, object>();
        res["totalIssues"] = issues.Count;
        res["issues"] = issues;

        File.WriteAllText(outReportPath, js.Serialize(res), Encoding.UTF8);
        Console.WriteLine("Code Health scan completed. Found " + issues.Count + " potential issues.");
    }

    private static int GetLineNumber(string text, int index) {
        int line = 1;
        for (int i = 0; i < index && i < text.Length; i++) {
            if (text[i] == '\n') line++;
        }
        return line;
    }
}
"@

Add-Type -TypeDefinition $csharp -ReferencedAssemblies "System.Web.Extensions"
$srcDir = "c:\Users\BERKE\.gemini\antigravity\scratch\NexusHub\src\renderer\src"
$outReportPath = "c:\Users\BERKE\.gemini\antigravity\scratch\NexusHub\.agents\explorer_frontend\code_health_report.json"

[CodeHealthAuditor]::Run($srcDir, $outReportPath)
