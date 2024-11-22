/* Usage:

filter := TextFilter()
text := "This is a test with \"f u c k f.uc.k f-u-c-k fUCK Fuck\" and sh!t s h 1 t."
cleanedText := filter.cleanText(text)
fmt.Println("Cleaned text:", cleanedText) // Expected output: **** **** **** **** ****" and **** ****

*/

package lib

import (
	"regexp"
	"strings"
)

type TextContentFilter struct {
	cussWords       []string
	evasionPatterns []struct {
		pattern     *regexp.Regexp
		replacement string
	}
}

func TextFilter() *TextContentFilter {
	return &TextContentFilter{
		cussWords: []string{"fuck", "shit"}, // TODO: add es, en
		evasionPatterns: []struct {
			pattern     *regexp.Regexp
			replacement string
		}{
			{regexp.MustCompile("4"), "a"},
			{regexp.MustCompile("$"), "s"},
			{regexp.MustCompile("5"), "s"},
			{regexp.MustCompile("0"), "o"},
			{regexp.MustCompile("1"), "i"},
			{regexp.MustCompile("!"), "i"},
			{regexp.MustCompile("@"), "a"},
			{regexp.MustCompile("3"), "e"},
		},
	}
}

func (filter *TextContentFilter) normalizeText(text string) string {
	text = strings.ToLower(text)
	for _, pattern := range filter.evasionPatterns {
		text = pattern.pattern.ReplaceAllString(text, pattern.replacement)
	}
	return text
}

func (filter *TextContentFilter) CleanText(text string) string {
	cleanedText := strings.ToLower(text) // Convert to lowercase

	// * detect Evasion Characters
	cleanedText = filter.normalizeText(cleanedText)

	// * detect Evasion Separators
	cleanedText = strings.ReplaceAll(cleanedText, "-", "")
	cleanedText = strings.ReplaceAll(cleanedText, "_", "")
	cleanedText = strings.ReplaceAll(cleanedText, ".", "")
	cleanedText = strings.ReplaceAll(cleanedText, ":", "")
	cleanedText = strings.ReplaceAll(cleanedText, ";", "")

	// Handle spaces between letters
	for _, cussWord := range filter.cussWords {
		wordRegexStr := strings.Join(strings.Split(cussWord, ""), "\\s*")
		wordRegex := regexp.MustCompile(wordRegexStr)

		// Replace occurrences with asterisks
		cleanedText = wordRegex.ReplaceAllStringFunc(cleanedText, func(match string) string {
			return strings.Repeat("*", len(match)-strings.Count(match, " ")) // Only replace non-space characters with '*'
		})
	}

	return cleanedText
}
