<?php
$eventDispatcher = \OC::$server->getEventDispatcher();

$eventDispatcher->addListener(
    'OCA\\Files::loadAdditionalScripts',
    function () {
    \OCP\Util::addScript('massassigntags', 'script');
}
);
