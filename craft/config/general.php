<?php

/**
 * General Configuration
 *
 * All of your system's general configuration settings go in here.
 * You can see a list of the default settings in craft/app/etc/config/defaults/general.php
 */

// LOCAL DOMAINS
$devDomains = array('localhost');

// TEST DOMAINS
$testDomains = array('www.test.fierselektrotechniek.nl', 'test.fierselektrotechniek.nl');

// PRODUCTION DOMAINS
$productionDomains = array('www.fierselektrotechniek.nl', 'fierselektrotechniek.nl');

// BASE PATHS
$basePaths = array('dev'       => 'C:/Users/Rick/Documents/Development/Fiers Elektrotechniek/fiers-elektrotechniek/public/',
                   'test'      => '/home/fierselektrotechniek.nl/public_html/test/',
                   'prod'      => '/home/fierselektrotechniek.nl/public_html/'
                  );

// DETERMINE CURRENT PROTOCOL
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https" : "http";

$configArray = array();

// Increase memory limit everywhere
ini_set('memory_limit','256M');

// Develop
if ( in_array($_SERVER['HTTP_HOST'], $devDomains) ) {

  $domainsArray = $devDomains;

  // Main Array
  $main = array(
      'phpMaxMemoryLimit' => '256M',


      '*' => array(
          'omitScriptNameInUrls' => true,
          'devMode' => true,
          'enableTemplateCaching' => false,
          'addTrailingSlashesToUrls' => false
      )

    );

  // SiteUrls array
  $siteUrls = array();
  foreach ( $domainsArray as $domainLocale => $domain ) {
    $siteUrls[ $domainLocale ] = '//' . $domain;
  }

  // Domains array
  $domains = array();
  foreach ( $domainsArray as $domainLocale => $domain ) {

    if ( !strstr($domain, '/') ) {
      $domains[ $domain ] = array(
          'environmentVariables' => array(
              'baseUrl'  => '//' . $domain,
              'basePath' => $basePaths['dev'],
              'siteProtocol' => $protocol,
              'serverType' => 'develop'
          ),
          'siteUrl' => $siteUrls
        );
    }
  }

  $configArray = array_merge($main, $domains);

} // Test
elseif ( in_array($_SERVER['HTTP_HOST'], $testDomains) ) {

  $domainsArray = $testDomains;

  // Main Array
  $main = array(
      'phpMaxMemoryLimit' => '256M',

      '*' => array(
          'omitScriptNameInUrls' => true,
          'devMode' => false,
          'enableTemplateCaching' => true,
          'addTrailingSlashesToUrls' => false,
          'backupDbOnUpdate' => true
      )

    );

  // SiteUrls array
  $siteUrls = array();
  foreach ( $domainsArray as $domainLocale => $domain ) {
    $siteUrls[ $domainLocale ] = '//' . $domain;
  }

  // Domains array
  $domains = array();
  foreach ( $domainsArray as $domainLocale => $domain ) {

    if ( !strstr($domain, '/') ) {
      $domains[ $domain ] = array(
          'environmentVariables' => array(
              'baseUrl'  => '//' . $domain,
              'basePath' => $basePaths['test'],
              'siteProtocol' => $protocol,
              'serverType' => 'test'
          ),
          'siteUrl' => $siteUrls
        );
    }
  }

  $configArray = array_merge($main, $domains);
} // Production
elseif ( in_array($_SERVER['HTTP_HOST'], $productionDomains) ) {

  $domainsArray = $productionDomains;

  // Main Array
  $main = array(
      'phpMaxMemoryLimit' => '256M',

      '*' => array(
          'omitScriptNameInUrls'  => true,
          'enableTemplateCaching' => true,
          'addTrailingSlashesToUrls' => false,
          'suppressTemplateErrors' => true
      )

    );

  // SiteUrls array
  $siteUrls = array();
  foreach ( $domainsArray as $domainLocale => $domain ) {
    $siteUrls[ $domainLocale ] = '//' . $domain;
  }

  // Domains array
  $domains = array();
  foreach ( $domainsArray as $domainLocale => $domain ) {

    if ( !strstr($domain, '/') ) {
      $domains[ $domain ] = array(
          'environmentVariables' => array(
              'baseUrl'  => '//' . $domain,
              'basePath' => $basePaths['prod'],
              'siteProtocol' => $protocol,
              'serverType' => 'production'
          ),
          'siteUrl' => $siteUrls
        );
    }
  }

  $configArray = array_merge($main, $domains);

}

return $configArray;