<?php if (!defined('BASEPATH')) exit('No direct script access allowed');

return array(
	'components' => array(
		'db' => array(
			'connectionString' => 'pgsql:host=127.0.0.1;port=5432;dbname=limesurvey;',
			'emulatePrepare' => true,
			'username' => 'rohanchristopher',
			'password' => '',
			'charset' => 'utf8',
			'tablePrefix' => 'lime_',
		),
		'urlManager' => array(
			'urlFormat' => 'path',
			'rules' => array(),
			'showScriptName' => true,
		),
	),
	'config' => array(
		'debug' => 0,
		'debugsql' => 0,
	)
);
