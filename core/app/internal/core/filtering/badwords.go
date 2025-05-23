package core

import (
	"regexp"
	"strings"
)

type TextContentFilter struct {
	words           []string
	evasionPatterns []struct {
		pattern     *regexp.Regexp
		replacement string
	}
}

func TextFilter(words []string) *TextContentFilter {
	// * this is how you pass words
	// words := []string{}
	// utils.ReadFileLines("./lang/en.txt", func(encodedStr string) {
	// 	plainStr, err := base64.StdEncoding.DecodeString(encodedStr)
	// 	if err != nil {
	// 		fmt.Printf("failed to decode string", err)
	// 		return
	// 	}

	// 	words = append(words, plainStr)
	// })

	return &TextContentFilter{
		words: words,
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
	for _, cussWord := range filter.words {
		wordRegexStr := strings.Join(strings.Split(cussWord, ""), "\\s*")
		wordRegex := regexp.MustCompile(wordRegexStr)

		// Replace occurrences with asterisks
		cleanedText = wordRegex.ReplaceAllStringFunc(cleanedText, func(match string) string {
			return strings.Repeat("*", len(match)-strings.Count(match, " ")) // Only replace non-space characters with '*'
		})
	}

	return cleanedText
}
